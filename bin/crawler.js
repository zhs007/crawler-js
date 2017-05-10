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
let totalfundOptions = {
    // 主地址
    uri: 'http://fund.jrj.com.cn/family.shtml',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 持久化配置
    storage_type: STORAGE.SQL,
    storage_cfg: {
        filename: 'fund.sql',
        funcLine: ld => {
        return util.format("insert into fundbase(name, code) values('%s', '%s');", ld.name, ld.fundcode);
    }},

    // 分析数据
    funcOnAnalysis: crawler => {
        crawler.da.data('[href]').each((index, element) => {
            if (element.name == 'a' && element.attribs.href.indexOf('http://fund.jrj.com.cn/archives,') == 0) {
                console.log(element.attribs.href);
                console.log(element.attribs.title);

                let str0 = element.attribs.href.split(',');
                let fundcode = str0[1].split('.')[0];

                FundMsg.singleton.addFund({name: element.attribs.title, url: element.attribs.href, fundcode: fundcode});
                //crawler.storage.pushData({name: element.attribs.title, url: element.attribs.href, fundcode: fundcode});
            }

            return true;
        });

        // crawler.save();
    }
};

CrawlerMgr.singleton.startCrawler(totalfundOptions)
    .then(totalfundOptions.funcOnAnalysis);



