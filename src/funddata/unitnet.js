"use strict";

const util = require('util');
const fs = require('fs');
const moment = require('moment');
const { CrawlerMgr } = require('crawlercore');

const SQL_BATCH_NUMS = 1024;

class FundUintNetMgr{
    constructor() {
        this.mapFund = {};

        this.mapFundWaiting = {};

        this.mysqlid = undefined;
        this.cfg = undefined;
    }

    // cfg = {tablename, datename, codename, unitnetname}
    async init(mysqlid, cfg) {
        this.mysqlid = mysqlid;
        this.cfg = cfg;
    }

    async _initFactor_unitnet_codeday(ti, curday, rows) {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        let fullsql = '';

        for (let i = 0; i < rows.length; ++i) {
            let sql = util.format("insert into fundfactor_unitnet_%d(code, timed) values('%s', '%s');", ti, rows[i].code, curday);

            fullsql += sql;
        }

        try{
            await conn.query(fullsql);
        }
        catch(err) {
            console.log('_initFactor_unitnet_codeday error ' + err.toString());
        }
    }

    async _initFactor_unitnet_day(ti, curday) {
        console.log('_initFactor_unitnet_day ' + curday);

        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        let ssql = util.format("select %s as code from %s%d where date(%s) = '%s'", this.cfg.codename, this.cfg.tablename, ti, this.cfg.datename, curday);

        try{
            let [rows, fields] = await conn.query(ssql);
            await this._initFactor_unitnet_codeday(ti, curday, rows);
        }
        catch(err) {
            console.log('_initFactor_unitnet_day error ' + sql + ' ' + err.toString());
        }
    }

    async initFactor_unitnet(startday, endday) {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        for (let i = 0; i < 10; ++i) {
            let sql = util.format("select distinct(%s) as timed from %s%d where date(%s) >= '%s' and date(%s) < '%s'", this.cfg.datename, this.cfg.tablename, i, this.cfg.datename, startday, this.cfg.datename, endday);

            try{
                let [rows, fields] = await conn.query(sql);
                for (let j = 0; j < rows.length; ++j) {
                    await this._initFactor_unitnet_day(i, moment(rows[j].timed).format('YYYY-MM-DD'));
                }
            }
            catch(err) {
                console.log('initFactor_unitnet error ' + sql + ' ' + err.toString());
            }
        }
    }

    async _calculateFactor_unitnet_codebase(ti, code, rows) {
        let fullsql = '';

        let baseco = undefined;     // equ
        let basecoex = undefined;   // not equ
        let lastco = undefined;
        for (let i = 0; i < rows.length; ++i) {
            let co = {
                timed: moment(rows[i].timed).format('YYYY-MM-DD'),
                uprate: 0,
                downrate: 0,
                updays: 0,
                downdays: 0,
            };

            if (rows[i].unitnet != null && rows[i].unitnet > 0) {
                co.unitnet = rows[i].unitnet;

                if (lastco == undefined) {
                    co.unitchg = 0;
                    co.unitchgper = 0;
                }
                else {
                    co.unitchg = rows[i].unitnet - lastco.unitnet;
                    if (co.unitchg == 0 || lastco.unitnet == 0) {
                        co.unitchgper = 0;
                    }
                    else {
                        co.unitchgper = Math.floor((co.unitchg / lastco.unitnet) * 10000);
                    }
                }

                if (baseco != undefined) {
                    if (co.unitchgper >= 0 && baseco.unitchgper >= 0) {
                        baseco.unitchgper += co.unitchgper;
                        baseco.updays++;
                        baseco.uprate = baseco.unitchgper;
                    }
                    else if (co.unitchgper <= 0 && baseco.unitchgper <= 0) {
                        baseco.unitchgper += co.unitchgper;
                        baseco.downdays++;
                        baseco.downrate = baseco.unitchgper;
                    }
                    else {
                        baseco = co;
                    }

                    if (baseco.unitchgper == 0) {
                        baseco.updays = 0;
                        baseco.downdays = 0;
                    }
                }

                if (baseco == undefined) {
                    baseco = co;
                }

                if (basecoex == undefined) {
                    basecoex = co;
                }

                let sql = util.format("update fundfactor_unitnet_%d set unitnet = %d, unitchg = %d, unitchgper = %d, " +
                    "uprate = %d, downrate = %d, updays = %d, downdays = %d where code = '%s' and date(timed) = '%s';",
                    ti, co.unitnet, co.unitchg, co.unitchgper, baseco.uprate, baseco.downrate, baseco.updays, baseco.downdays, code, co.timed);

                lastco = co;

                fullsql += sql;
            }
        }

        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        try{
            if (fullsql != '') {
                await conn.query(fullsql);
            }
        }
        catch(err) {
            console.log('_calculateFactor_unitnet_codebase error ' + fullsql + ' ' + err.toString());
        }
    }

    async _calculateFactor_unitnet_code(ti, startday, endday, code) {
        console.log('_calculateFactor_unitnet_code ' + startday + ' ' + endday + ' ' + code);

        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        let sql = util.format("select %s as code, %s as timed, %s as unitnet from %s%d where date(%s) >= '%s' and date(%s) < '%s' and %s = '%s' order by %s;",
            this.cfg.codename, this.cfg.datename, this.cfg.unitnetname, this.cfg.tablename, ti, this.cfg.datename, startday, this.cfg.datename, endday, this.cfg.codename, code, this.cfg.datename);

        try{
            let [rows, fields] = await conn.query(sql);
            await this._calculateFactor_unitnet_codebase(ti, code, rows);
        }
        catch(err) {
            console.log('_calculateFactor_unitnet_code error ' + sql + ' ' + err.toString());
        }
    }

    async calculateFactor_unitnet(startday, endday) {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        for (let i = 0; i < 10; ++i) {
            let sql = util.format("select distinct(%s) as code from %s%d where date(%s) >= '%s' and date(%s) < '%s';", this.cfg.codename, this.cfg.tablename, i, this.cfg.datename, startday, this.cfg.datename, endday);

            try{
                let [rows, fields] = await conn.query(sql);
                for (let j = 0; j < rows.length; ++j) {
                    await this._calculateFactor_unitnet_code(i, startday, endday, rows[j].code);
                }
            }
            catch(err) {
                console.log('calculateFactor_unitnet error ' + sql + ' ' + err.toString());
            }
        }
    }
}

FundUintNetMgr.singleton = new FundUintNetMgr();

exports.FundUintNetMgr = FundUintNetMgr;