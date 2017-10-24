"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let {StockMgr} = require('./stockmgr');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');

// 分析数据
async function func_analysis(crawler) {
    crawler.da.runCurCode();
    crawler.da.runScript('var lst = get_data();');
    let lst = crawler.da.context.lst;

    for (let i = 0; i < lst.length; ++i) {
        if (!StockMgr.singleton.isAlreadyInDB(lst[i].val)) {
            StockMgr.singleton.addStock(lst[i].val, lst[i].val2, lst[i].val3);

            console.log(lst[i]);
        }
    }

    return crawler;
}

let stocklistjsOptions = {
    // 主地址
    uri: 'http://www.sse.com.cn/js/common/ssesuggestdata.js;pv8b21d2075867a9bf',
    timeout: 30 * 1000,

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.JAVASCRIPT,

    // 分析数据
    func_analysis: func_analysis
};

function startStockListJSCrawler(uri) {
    let op = Object.assign({}, stocklistjsOptions);
    op.uri = uri;
    CrawlerMgr.singleton.addCrawler(op);
}

exports.stocklistjsOptions = stocklistjsOptions;
exports.startStockListJSCrawler = startStockListJSCrawler;