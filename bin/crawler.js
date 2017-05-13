"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../index');
let util = require('util');

class FundState {
    constructor() {
        this.arr = [];
    }

    addState(s) {
        if (this.arr.indexOf(s) < 0) {
            this.arr.push(s);
        }
    }
};

FundState.singleton = new FundState();

class FundMsg {
    constructor() {
        this.map = {};
    }

    addFund(fund) {
        this.map[fund.fundcode] = fund;
    }
};

FundMsg.singleton = new FundMsg();

// 主页面配置
let fundbaseOptions = {
    // 主地址
    uri: '',
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
        });

        for (let ii = 0; ii < fsarr.length; ++ii) {
            FundState.singleton.addState(fsarr[ii]);
        }

        FundMsg.singleton.map[code].name = title;
        FundMsg.singleton.map[code].fsarr = fsarr;

        return crawler;
    }
};

// 主页面配置
let totalfundOptions = {
    // 主地址
    uri: 'http://fund.jrj.com.cn/family.shtml',
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

                FundMsg.singleton.addFund({name: element.attribs.title, url: element.attribs.href, fundcode: fundcode, fsarr: []});

                let co = Object.assign({}, fundbaseOptions);
                co.uri = element.attribs.href;
                CrawlerMgr.singleton.addCrawler(co);
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
CrawlerMgr.singleton.addCrawler(totalfundOptions);
CrawlerMgr.singleton.start(true, true);
