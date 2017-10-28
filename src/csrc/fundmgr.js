"use strict";

const util = require('util');
const fs = require('fs');
const moment = require('moment');
const { CrawlerMgr } = require('crawlercore');

// const mysqlcfg = JSON.parse(fs.readFileSync('./mysqlcfg_hfdb.json').toString());
// mysqlcfg.multipleStatements = true;

const SQL_BATCH_NUMS = 1024;

class FundMgr{
    constructor() {
        this.mapFund = {};

        // this.conn = undefined;

        this.mapFundWaiting = {};

        this.mysqlid = undefined;
    }

    async loadFundBase() {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        let str = util.format("select * from csrcfund");
        let [rows, fields] = await conn.query(str);
        for (let i = 0; i < rows.length; ++i) {
            this.addFund(rows[i].code, rows[i].name, rows[i].uri, rows[i].company, rows[i].acttype, rows[i].fundtype,
                rows[i].trustee, moment(rows[i].startday).format('YYYY-MM-DD'), rows[i].endday, true);
        }
    }

    async init(mysqlid) {
        this.mysqlid = mysqlid;

        // this.conn = await createMysql2(mysqlcfg);
        await this.loadFundBase();
    }

    async saveFundBase() {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        let fullsql = '';
        let sqlnums = 0;
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

    async saveFundNet(map, curday) {
        let conn = CrawlerMgr.singleton.getMysqlConn(this.mysqlid);

        let fullsql = '';
        let sqlnums = 0;

        // 绝对信任最新的数据，所以干脆先把老数据删掉
        for (let i = 0; i < 10; ++i) {
            let sql = util.format("delete from csrcfundnet_%d where curday = '%s';", i, curday);

            fullsql += sql;
            ++sqlnums;
        }

        try{
            await conn.query(fullsql);
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

        let ssql = util.format("select code from csrcfundnet_%d where date(curday) = '%s'", ti, curday);

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
            let sql = util.format("select distinct(curday) from csrcfundnet_%d where date(curday) >= '%s' and date(curday) < '%s'", i, startday, endday);

            try{
                let [rows, fields] = await conn.query(sql);
                for (let j = 0; j < rows.length; ++j) {
                    await this._initFactor_unitnet_day(i, moment(rows[j].curday).format('YYYY-MM-DD'));
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
                timed: moment(rows[i].curday).format('YYYY-MM-DD'),
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

        let sql = util.format("select * from csrcfundnet_%d where date(curday) >= '%s' and date(curday) < '%s' and code = '%s' order by curday;", ti, startday, endday, code);

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
            let sql = util.format("select distinct(code) from csrcfundnet_%d where date(curday) >= '%s' and date(curday) < '%s';", i, startday, endday);

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

FundMgr.singleton = new FundMgr();

exports.FundMgr = FundMgr;