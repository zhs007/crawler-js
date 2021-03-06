"use strict";

const util = require('util');
const fs = require('fs');
const moment = require('moment');
const { CrawlerMgr } = require('crawlercore');

const SQL_BATCH_NUMS = 4096;

class LotteryMgr{
    constructor() {
        this.mysqlid = undefined;
    }

    async init(mysqlid) {
        this.mysqlid = mysqlid;
    }

    async savePK10(lst) {
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

            let tname = 'pk10';
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
}

LotteryMgr.singleton = new LotteryMgr();

exports.LotteryMgr = LotteryMgr;