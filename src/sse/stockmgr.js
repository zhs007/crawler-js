"use strict";

const util = require('util');
const fs = require('fs');
const mysql = require('mysql2/promise');
const moment = require('moment');

const mysqlcfg = JSON.parse(fs.readFileSync('./mysqlcfg_hfdb.json').toString());
mysqlcfg.multipleStatements = true;

const SQL_BATCH_NUMS = 1024;

class StockMgr{
    constructor() {
        this.mapStock = {};

        this.conn = undefined;

        this.mapStockWaiting = {};
    }

    async loadStockBase() {
        let str = util.format("select * from ssestock");
        let [rows, fields] = await this.conn.query(str);
        for (let i = 0; i < rows.length; ++i) {
            this.addStock(rows[i].code, rows[i].cname, rows[i].ename, true);
        }
    }

    async init() {
        this.conn = await mysql.createConnection(mysqlcfg);
        await this.loadStockBase();
    }

    async saveStockBase() {
        let fullsql = '';
        let sqlnums = 0;
        for (let code in this.mapStock) {
            let curstock = this.mapStock[code];
            if (!curstock.indb) {
                let str0 = '';
                let str1 = '';

                let i = 0;
                for (let key in curstock) {
                    if (key != 'indb') {
                        if (i != 0) {
                            str0 += ', ';
                            str1 += ', ';
                        }

                        str0 += '`' + key + '`';
                        str1 += "'" + curstock[key] + "'";

                        ++i;
                    }
                }

                let sql = util.format("insert into ssestock(%s) values(%s);", str0, str1);
                fullsql += sql;
                ++sqlnums;

                if (sqlnums >= SQL_BATCH_NUMS) {
                    try{
                        await this.conn.query(fullsql);
                    }
                    catch(err) {
                        console.log('mysql err: ' + fullsql);
                    }

                    fullsql = '';
                    sqlnums = 0;
                }
            }
        }

        if (sqlnums > 0) {
            try{
                await this.conn.query(fullsql);
            }
            catch(err) {
                console.log('mysql err: ' + fullsql);
            }
        }
    }

    async saveFundNet(map, curday) {
        let fullsql = '';
        let sqlnums = 0;

        // 绝对信任最新的数据，所以干脆先把老数据删掉
        for (let i = 0; i < 10; ++i) {
            let sql = util.format("delete from csrcfundnet_%d where curday = '%s';", i, curday);

            fullsql += sql;
            ++sqlnums;
        }

        try{
            await this.conn.query(fullsql);
        }
        catch(err) {
            console.log('mysql err: ' + fullsql);
        }

        fullsql = '';
        sqlnums = 0;

        for (let code in map) {
            let curfundnet = map[code];
            let str0 = '';
            let str1 = '';

            let cfn = {
                code: curfundnet.code,
                curday: curday,
                unitnet: curfundnet.net,
                accumnet: curfundnet.totalnet,
                hundred: curfundnet.hundred,
                tenthousand: curfundnet.tenthousand,
                million: curfundnet.million,
                annualizedrate: curfundnet.annualizedrate
            };

            let i = 0;
            for (let key in cfn) {
                if (cfn[key] != undefined) {
                    if (i != 0) {
                        str0 += ', ';
                        str1 += ', ';
                    }

                    str0 += '`' + key + '`';
                    str1 += "'" + cfn[key] + "'";

                    ++i;
                }
            }

            let tname = 'csrcfundnet_' + code.charAt(5);
            let sql = util.format("insert into %s(%s) values(%s);", tname, str0, str1);

            fullsql += sql;
            ++sqlnums;

            if (sqlnums > SQL_BATCH_NUMS) {
                try {
                    await this.conn.query(fullsql);
                }
                catch(err) {
                    console.log('mysql err: ' + fullsql);
                }

                fullsql = '';
                sqlnums = 0;
            }
        }

        if (sqlnums > 0) {
            try {
                await this.conn.query(fullsql);
            }
            catch(err) {
                console.log('mysql err: ' + fullsql);
            }
        }
    }

    isAlreadyInDB(code) {
        if (this.mapStock.hasOwnProperty(code) && this.mapStock[code].indb) {
            return true;
        }

        return false;
    }

    isNeedIn(code) {
        if (this.isAlreadyInDB(code)) {
            return false;
        }

        if (this.mapStockWaiting.hasOwnProperty(code)) {
            return false;
        }

        return true;
    }

    addStock(code, cname, ename, indb) {
        let s = {
            code: code,
            cname: cname,
            ename: ename,
            indb: indb
        };

        this.mapStock[code] = s;
    }
}

StockMgr.singleton = new StockMgr();

exports.StockMgr = StockMgr;