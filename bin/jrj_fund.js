"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../index');
let util = require('util');
let fs = require('fs');
let mysql = require('mysql2/promise');

const MODE_INITBASE = false;

const mysqlcfg = JSON.parse(fs.readFileSync('./mysqlcfg_hfdb.json').toString());

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
        this.conn = undefined;
    }

    async init(mysqlcfg) {
        this.conn = await mysql.createConnection(mysqlcfg);
    }

    addFund(fund) {
        this.map[fund.fundcode] = fund;
    }

    async saveFundBase() {
        for (let key in this.map) {
            let curfund = this.map[key];
            let str = util.format("insert into fundbase(name, code, type0, type1, type2) values('%s', '%s', '%s', '%s', '%s');",
                curfund.name, curfund.fundcode, curfund.fsarr[0], curfund.fsarr[1], curfund.fsarr[2]);
            await this.conn.query(str);
        }
    }

    async saveFundArch(fundcode, lst, year) {
        for (let mi = 1; mi <= 12; ++mi) {
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

                    let str = util.format("insert into networth(fundcode, enddate, accum_net, unit_net, unit_net_chng_1, unit_net_chng_pct, unit_net_chng_pct_1_mon, unit_net_chng_pct_1_week, unit_net_chng_pct_1_year, unit_net_chng_pct_3_mon, guess_net) " +
                        "values('%s', '%s', %d, %d, %d, %d, %d, %d, %d, %d, %d);",
                        fundcode, curday, curarch.accum_net, curarch.unit_net, curarch.unit_net_chng_1,
                        curarch.unit_net_chng_pct, curarch.unit_net_chng_pct_1_mon, curarch.unit_net_chng_pct_1_week,
                        curarch.unit_net_chng_pct_1_year, curarch.unit_net_chng_pct_3_mon, curarch.guess_net);

                    //console.log(str);
                    await this.conn.query(str);
                }
            }
        }
    }
};

FundMgr.singleton = new FundMgr();

// fund净值页面配置
let fundarchOptions = {
    fundcode: '000975',
    year: 2016,

    // 主地址
    uri: 'http://fund.jrj.com.cn/json/archives/history/netvalue?fundCode=000975&obj=obj&date=2016',
    timeout: 1500,
    force_encoding: 'gbk',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.NULL,

    // 持久化配置
    storage_type: STORAGE.SQL,
    storage_cfg: {
        filename: 'fund.sql',
        func_procline: ld => {
            return util.format("insert into fundbase(name, code) values('%s', '%s');", ld.name, ld.fundcode);
        }},

    // 分析数据
    func_analysis: async crawler => {
        let fundinfo = FundMgr.singleton.map[crawler.options.fundcode];

        let jsonstr = crawler.data.substr(8);
        let obj = JSON.parse(jsonstr);

        if (obj.hasOwnProperty('fundHistoryNetValue') && Array.isArray(obj.fundHistoryNetValue)) {
            for (let ii = 0 ; ii < obj.fundHistoryNetValue.length; ++ii) {
                let curfdnv = obj.fundHistoryNetValue[ii];

                fundinfo.lstval[curfdnv.enddate] = {
                    enddate: curfdnv.enddate,
                    accum_net: Math.floor(parseFloat(curfdnv.accum_net) * 10000),
                    unit_net: Math.floor(parseFloat(curfdnv.unit_net) * 10000),
                    unit_net_chng_1: Math.floor(parseFloat(curfdnv.unit_net_chng_1) * 10000),
                    unit_net_chng_pct: Math.floor(parseFloat(curfdnv.unit_net_chng_pct) * 10000),
                    unit_net_chng_pct_1_mon: Math.floor(parseFloat(curfdnv.unit_net_chng_pct_1_mon) * 10000),
                    unit_net_chng_pct_1_week: Math.floor(parseFloat(curfdnv.unit_net_chng_pct_1_week) * 10000),
                    unit_net_chng_pct_1_year: Math.floor(parseFloat(curfdnv.unit_net_chng_pct_1_year) * 10000),
                    unit_net_chng_pct_3_mon: Math.floor(parseFloat(curfdnv.unit_net_chng_pct_3_mon) * 10000),
                    guess_net: 0
                };

                if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net)) {
                    fundinfo.lstval[curfdnv.enddate].unit_net = 0;
                }

                if (isNaN(fundinfo.lstval[curfdnv.enddate].accum_net)) {
                    fundinfo.lstval[curfdnv.enddate].accum_net = 0;
                }

                if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_1)) {
                    fundinfo.lstval[curfdnv.enddate].unit_net_chng_1 = 0;
                }

                if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct)) {
                    fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct = 0;
                }

                if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_mon)) {
                    fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_mon = 0;
                }

                if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_week)) {
                    fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_week = 0;
                }

                if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_year)) {
                    fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_year = 0;
                }

                if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_3_mon)) {
                    fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_3_mon = 0;
                }
            }

            if (crawler.options.year == 2017) {
                for (let iy = 2015; iy <= 2017; ++iy) {
                    await FundMgr.singleton.saveFundArch(crawler.options.fundcode, fundinfo.lstval, iy);
                }
            }
        }

        return crawler;
    }
};

// fund主页面配置
let fundbaseOptions = {
    // 主地址
    uri: '',
    timeout: 1500,
    force_encoding: 'gbk',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 持久化配置
    storage_type: STORAGE.SQL,
    storage_cfg: {
        filename: 'fund.sql',
        func_procline: ld => {
            return util.format("insert into fundbase(name, code) values('%s', '%s');", ld.name, ld.fundcode);
        }},

    // 分析数据
    func_analysis: async crawler => {
        let mh_title = crawler.da.data('h1.mh-title').text();
        let titlearr0 = mh_title.split('（');
        let titlearr1 = titlearr0[1].split('）');
        let title = titlearr0[0];
        let code = titlearr1[0];

        let fsarr = [];
        crawler.da.data('i.zt').each((index, element) => {
            if (element.children.length > 0 && element.children[0].children.length > 0) {
                fsarr.push(element.children[0].children[0].data);
            }
            else {
                fsarr.push('');
            }
        });

        if (fsarr.length == 2) {
            fsarr.splice(0, 0, '');
        }

        for (let ii = 0; ii < fsarr.length; ++ii) {
            FundState.singleton.addState(fsarr[ii]);
        }

        FundMgr.singleton.map[code].name = title;
        FundMgr.singleton.map[code].fsarr = fsarr;

        return crawler;
    }
};

// 主页面配置
let totalfundOptions = {
    // 主地址
    uri: 'http://fund.jrj.com.cn/family.shtml',
    timeout: 1500,
    force_encoding: 'gbk',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 持久化配置
    storage_type: STORAGE.SQL,
    storage_cfg: {
        filename: 'fund.sql',
        func_procline: ld => {
            return util.format("insert into fundbase(name, code) values('%s', '%s');", ld.name, ld.fundcode);
        }},

    // 分析数据
    func_analysis: async crawler => {
        crawler.da.data('[href]').each((index, element) => {
            if (element.name == 'a' && element.attribs.href.indexOf('http://fund.jrj.com.cn/archives,') == 0) {
                //console.log(element.attribs.href);
                //console.log(element.attribs.title);

                let str0 = element.attribs.href.split(',');
                let fundcode = str0[1].split('.')[0];

                FundMgr.singleton.addFund({
                    name: element.attribs.title,
                    url: element.attribs.href,
                    fundcode: fundcode,
                    fsarr: [],
                    lstval: {}
                });

                if (MODE_INITBASE) {
                    let co = Object.assign({}, fundbaseOptions);
                    co.uri = element.attribs.href;
                    CrawlerMgr.singleton.addCrawler(co);
                }
                else {
                    for (let year = 2015; year <= 2017; ++year) {
                        let co = Object.assign({}, fundarchOptions);
                        co.fundcode = fundcode;
                        co.year = year;
                        co.uri = util.format('http://fund.jrj.com.cn/json/archives/history/netvalue?fundCode=%s&obj=obj&date=%d', fundcode, year);
                        CrawlerMgr.singleton.addCrawler(co);
                    }
                }

                // return false;
                //crawler.storage.pushData({name: element.attribs.title, url: element.attribs.href, fundcode: fundcode});
            }

            return true;
        });

        return crawler;
    }
};

//CrawlerMgr.singleton.startHeapdump(10000);
//CrawlerMgr.singleton.startMemWatch();

CrawlerMgr.singleton.processCrawlerNums = 8;
CrawlerMgr.singleton.processDelayTime = 0.3;

FundMgr.singleton.init(mysqlcfg).then(() => {
    CrawlerMgr.singleton.addCrawler(totalfundOptions);
    //CrawlerMgr.singleton.addCrawler(fundarchOptions);
    CrawlerMgr.singleton.start(true, true, async () => {
        FundState.singleton.output();

        await FundMgr.singleton.saveFundBase();
    }, true);
});
