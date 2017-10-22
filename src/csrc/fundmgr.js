"use strict";

const util = require('util');
const fs = require('fs');
const mysql = require('mysql2/promise');
const moment = require('moment');

const mysqlcfg = JSON.parse(fs.readFileSync('./mysqlcfg_hfdb.json').toString());
mysqlcfg.multipleStatements = true;

class FundMgr{
    constructor() {
        this.mapFund = {};

        this.conn = undefined;

        this.mapFundWaiting = {};
    }

    async loadFundBase() {
        let str = util.format("select * from csrcfund");
        let [rows, fields] = await this.conn.query(str);
        for (let i = 0; i < rows.length; ++i) {
            this.addFund(rows[i].code, rows[i].name, rows[i].uri, rows[i].company, rows[i].acttype, rows[i].fundtype,
                rows[i].trustee, moment(rows[i].startday).format('YYYY-MM-DD'), rows[i].endday, true);
        }
    }

    async init() {
        this.conn = await mysql.createConnection(mysqlcfg);
        await this.loadFundBase();
    }

    async saveFundBase() {
        for (let code in this.mapFund) {
            let curfund = this.mapFund[code];
            if (!curfund.indb) {
                let str0 = '';
                let str1 = '';

                let i = 0;
                for (let key in curfund) {
                    if (key != 'indb') {
                        if (i != 0) {
                            str0 += ', ';
                            str1 += ', ';
                        }

                        str0 += '`' + key + '`';
                        str1 += "'" + curfund[key] + "'";

                        ++i;
                    }
                }

                let sql = util.format("insert into csrcfund(%s) values(%s);", str0, str1);
                await this.conn.query(sql);
            }
        }
    }

    async saveFundNet(map, curday) {
        // 绝对信任最新的数据，所以干脆先把老数据删掉
        for (let i = 0; i < 10; ++i) {
            let sql = util.format("delete from csrcfundnet_%d where curday = '%s';", i, curday);

            try{
                await this.conn.query(sql);
            }
            catch(err) {
                console.log('mysql err: ' + sql);
            }
        }

        for (let code in map) {
            let curfundnet = map[code];
            let str0 = '';
            let str1 = '';

            let cfn = {
                code: curfundnet.code,
                curday: curday,
                unitnet: curfundnet.net,
                accumnet: curfundnet.totalnet
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
            try {
                await this.conn.query(sql);
            }
            catch(err) {
                console.log('mysql err: ' + sql);
            }
        }
    }

    isAlreadyInDB(code) {
        if (this.mapFund.hasOwnProperty(code) && this.mapFund[code].indb) {
            return true;
        }

        return false;
    }

    isNeedIn(code) {
        if (this.isAlreadyInDB(code)) {
            return false;
        }

        if (this.mapFundWaiting.hasOwnProperty(code)) {
            return false;
        }

        return true;
    }

    addFund(code, name, uri, company, acttype, fundtype, trustee, startday, endday, indb) {
        let f = {
            code: code,
            name: name,
            uri: uri,
            company: company,
            acttype: acttype,
            fundtype: fundtype,
            trustee: trustee,
            startday: startday,
            endday: endday,
            indb: indb
        };

        this.mapFund[code] = f;
    }
}

FundMgr.singleton = new FundMgr();

exports.FundMgr = FundMgr;