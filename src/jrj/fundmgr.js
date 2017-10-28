"use strict";

const util = require('util');
const fs = require('fs');
const moment = require('moment');
const { CrawlerMgr } = require('crawlercore');

class FundState {
    constructor() {
        this.arr = [];
    }

    addState(s) {
        if (this.arr.indexOf(s) < 0) {
            this.arr.push(s);
        }
    }

    output() {
        for (let ii = 0; ii < this.arr.length; ++ii) {
            console.log(this.arr[ii]);
        }
    }
};

FundState.singleton = new FundState();

class FundMgr {
    constructor() {
        this.map = {};

        this.mysqlid = undefined;
        // this.conn = undefined;
    }

    async init(mysqlid) {
        this.mysqlid = mysqlid;
        // this.conn = await mysql.createConnection(mysqlcfg);
    }

    addFund(fund) {
        this.map[fund.fundcode] = fund;
    }

    async saveFundBase() {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        for (let key in this.map) {
            let sql = '';

            try {
                let curfund = this.map[key];

                sql = util.format("insert into fundbase(name, code, type0, type1, type2) values('%s', '%s', '%s', '%s', '%s');",
                    curfund.name, curfund.fundcode, curfund.fsarr[0], curfund.fsarr[1], curfund.fsarr[2]);
                await conn.query(sql);
            }
            catch(err) {
                console.log('saveFundBase error ' + sql + ' ' + err.toString());
            }
        }
    }

    async saveFundArch(fundcode, lst, year) {
        let tname = 'networth_' + fundcode.charAt(5);
        for (let mi = 1; mi <= 12; ++mi) {
            let fullstr = '';

            let curm = '' + year + '-';
            if (mi < 10) {
                curm += '0';
            }

            curm += mi;

            for (let di = 1; di <= 31; ++di) {
                let curday = curm + '-';
                if (di < 10) {
                    curday += '0';
                }

                curday += di;

                if (lst.hasOwnProperty(curday)) {
                    let curarch = lst[curday];

                    if (curarch.accum_net != 0 || curarch.unit_net != 0 || curarch.unit_net_chng_1 != 0 ||
                        curarch.unit_net_chng_pct != 0 || curarch.unit_net_chng_pct_1_mon != 0 ||
                        curarch.unit_net_chng_pct_1_week != 0 || curarch.unit_net_chng_pct_1_year != 0 ||
                        curarch.unit_net_chng_pct_3_mon != 0 || curarch.guess_net != 0) {

                        let str = util.format("insert into %s(fundcode, enddate, accum_net, unit_net, unit_net_chng_1, unit_net_chng_pct, unit_net_chng_pct_1_mon, unit_net_chng_pct_1_week, unit_net_chng_pct_1_year, unit_net_chng_pct_3_mon, guess_net) " +
                            "values('%s', '%s', %d, %d, %d, %d, %d, %d, %d, %d, %d);",
                            tname, fundcode, curday, curarch.accum_net, curarch.unit_net, curarch.unit_net_chng_1,
                            curarch.unit_net_chng_pct, curarch.unit_net_chng_pct_1_mon, curarch.unit_net_chng_pct_1_week,
                            curarch.unit_net_chng_pct_1_year, curarch.unit_net_chng_pct_3_mon, curarch.guess_net);

                        //console.log(str);

                        fullstr += str;
                    }
                }
            }

            if (fullstr != '') {
                let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

                try{
                    await conn.query(fullstr);
                }
                catch(err) {
                    console.log('saveFundArch error ' + fullstr + ' ' + err.toString());
                }
            }
        }
    }

    async saveFundArchEx(fundcode, lst, year, startday, endday) {
        let tname = 'networth_' + fundcode.charAt(5);
        for (let mi = 1; mi <= 12; ++mi) {
            let fullstr = '';

            let curm = '' + year + '-';
            if (mi < 10) {
                curm += '0';
            }

            curm += mi;

            for (let di = 1; di <= 31; ++di) {
                let curday = curm + '-';
                if (di < 10) {
                    curday += '0';
                }

                curday += di;

                if (lst.hasOwnProperty(curday)) {
                    let curarch = lst[curday];

                    if (curday >= startday && curday <= endday) {
                        {
                            let str = util.format("delete from %s where fundcode = '%s' and enddate = '%s';", tname, fundcode, curday);
                            // let str = util.format("update %s set accum_net = %d, unit_net = %d, unit_net_chng_1 = %d, unit_net_chng_pct = %d, unit_net_chng_pct_1_mon = %d, " +
                            //     "unit_net_chng_pct_1_week = %d, unit_net_chng_pct_1_year = %d, unit_net_chng_pct_3_mon = %d, guess_net = %d where fundcode = '%s' and enddate = '%s';",
                            //     tname, curarch.accum_net, curarch.unit_net, curarch.unit_net_chng_1,
                            //     curarch.unit_net_chng_pct, curarch.unit_net_chng_pct_1_mon, curarch.unit_net_chng_pct_1_week,
                            //     curarch.unit_net_chng_pct_1_year, curarch.unit_net_chng_pct_3_mon, curarch.guess_net, fundcode, curday);

                            // console.log(str);

                            fullstr += str;
                        }

                        {
                            if (curarch.accum_net != 0 || curarch.unit_net != 0 || curarch.unit_net_chng_1 != 0 ||
                                curarch.unit_net_chng_pct != 0 || curarch.unit_net_chng_pct_1_mon != 0 ||
                                curarch.unit_net_chng_pct_1_week != 0 || curarch.unit_net_chng_pct_1_year != 0 ||
                                curarch.unit_net_chng_pct_3_mon != 0 || curarch.guess_net != 0) {

                                let str = util.format("insert into %s(fundcode, enddate, accum_net, unit_net, unit_net_chng_1, unit_net_chng_pct, unit_net_chng_pct_1_mon, unit_net_chng_pct_1_week, unit_net_chng_pct_1_year, unit_net_chng_pct_3_mon, guess_net) " +
                                    "values('%s', '%s', %d, %d, %d, %d, %d, %d, %d, %d, %d);",
                                    tname, fundcode, curday, curarch.accum_net, curarch.unit_net, curarch.unit_net_chng_1,
                                    curarch.unit_net_chng_pct, curarch.unit_net_chng_pct_1_mon, curarch.unit_net_chng_pct_1_week,
                                    curarch.unit_net_chng_pct_1_year, curarch.unit_net_chng_pct_3_mon, curarch.guess_net);

                                //console.log(str);

                                fullstr += str;
                            }
                        }
                    }
                }
            }

            if (fullstr != '') {
                let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

                try{
                    await conn.query(fullstr);
                }
                catch(err) {
                    console.log('saveFundArchEx error ' + fullstr + ' ' + err.toString());
                }
            }
        }
    }
};

FundMgr.singleton = new FundMgr();

exports.FundState = FundState;
exports.FundMgr = FundMgr;