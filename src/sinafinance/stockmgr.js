"use strict";

const util = require('util');
const fs = require('fs');
// const mysql = require('mysql2/promise');
const moment = require('moment');
// const { addStockPriceMCrawler } = require('./stockpricem');
const { CrawlerMgr } = require('crawlercore');

// const mysqlcfg = JSON.parse(fs.readFileSync('./mysqlcfg_hfdb.json').toString());
// mysqlcfg.multipleStatements = true;

const SQL_BATCH_NUMS = 1024;

class StockMgr{
    constructor() {
        this.mapStock = {};
        this.mapStockWaiting = {};

        this.mysqlid = undefined;
    }

    async loadStockBase() {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        let str = util.format("select * from xqstock");
        let [rows, fields] = await conn.query(str);
        for (let i = 0; i < rows.length; ++i) {
            this.addStock(rows[i].code, rows[i].cname, rows[i].bourse, true);
        }
    }

    async init(mysqlid) {
        this.mysqlid = mysqlid;

        // this.conn = await mysql.createConnection(mysqlcfg);
        await this.loadStockBase();
    }

    async saveStockBase() {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

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

                let sql = util.format("insert into xqstock(%s) values(%s);", str0, str1);
                fullsql += sql;
                ++sqlnums;

                if (sqlnums >= SQL_BATCH_NUMS) {
                    try{
                        await conn.query(fullsql);
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
                await conn.query(fullsql);
            }
            catch(err) {
                console.log('mysql err: ' + fullsql);
            }
        }
    }

    async delStockPriceM(curday) {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        // 绝对信任最新的数据，所以干脆先把老数据删掉
        for (let i = 0; i < 10; ++i) {
            let sql = util.format("delete from ssestock_price_m_%d where date(timem) = '%s';", i, curday);

            try{
                await conn.query(sql);
            }
            catch(err) {
                console.log('mysql err: ' + sql);
            }
        }
    }

    async saveStockPriceM(code, lst, curday) {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        let fullsql = '';
        let sqlnums = 0;

        for (let i = 0; i < lst.length; ++i) {
            let cursp = lst[i];
            let str0 = '';
            let str1 = '';

            let j = 0;
            for (let key in cursp) {
                if (cursp[key] != undefined) {
                    if (j != 0) {
                        str0 += ', ';
                        str1 += ', ';
                    }

                    str0 += '`' + key + '`';
                    str1 += "'" + cursp[key] + "'";

                    ++j;
                }
            }

            let tname = 'sinastock_m_' + code.charAt(5);
            let sql = util.format("insert into %s(%s) values(%s);", tname, str0, str1);

            fullsql += sql;
            ++sqlnums;

            if (sqlnums > SQL_BATCH_NUMS) {
                try {
                    await conn.query(fullsql);
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
                await conn.query(fullsql);
            }
            catch(err) {
                console.log('mysql err: ' + fullsql);
            }
        }

        return true;
    }

    async delStockPriceD(curday) {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        // let fullsql = '';
        // let sqlnums = 0;

        // 绝对信任最新的数据，所以干脆先把老数据删掉
        for (let i = 0; i < 10; ++i) {
            let sql = util.format("delete from ssestock_price_d_%d where date(timed) = '%s';", i, curday);

            try{
                await conn.query(sql);
            }
            catch(err) {
                console.log('mysql err: ' + sql);
            }
        }

        // try{
        //     await conn.query(fullsql);
        // }
        // catch(err) {
        //     console.log('mysql err: ' + fullsql);
        // }
        //
        // fullsql = '';
        // sqlnums = 0;
    }

    async saveStockPriceD(code, curobj, curday) {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        let fullsql = '';
        let sqlnums = 0;

        // // 绝对信任最新的数据，所以干脆先把老数据删掉
        // for (let i = 0; i < 10; ++i) {
        //     let sql = util.format("delete from ssestock_price_d_%d where date(curday) = '%s';", i, curday);
        //
        //     fullsql += sql;
        //     ++sqlnums;
        // }
        //
        // try{
        //     await conn.query(fullsql);
        // }
        // catch(err) {
        //     console.log('mysql err: ' + fullsql);
        // }
        //
        // fullsql = '';
        // sqlnums = 0;


        let str0 = '';
        let str1 = '';

        let j = 0;
        for (let key in curobj) {
            if (curobj[key] != undefined) {
                if (j != 0) {
                    str0 += ', ';
                    str1 += ', ';
                }

                str0 += '`' + key + '`';
                str1 += "'" + curobj[key] + "'";

                ++j;
            }
        }

        let tname = 'ssestock_price_d_' + code.charAt(5);
        let sql = util.format("insert into %s(%s) values(%s);", tname, str0, str1);


        try {
            // console.log(sql);
            await conn.query(sql);
        }
        catch(err) {
            console.log('mysql err: ' + sql);
        }

        return true;
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

    addStock(code, cname, bourse, indb) {
        let s = {
            code: code,
            cname: cname,
            bourse: bourse,
            indb: indb
        };

        this.mapStock[code] = s;
    }
}

StockMgr.singleton = new StockMgr();

exports.StockMgr = StockMgr;