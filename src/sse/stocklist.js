"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');
let {startStockListJSCrawler} = require('./stocklistjs');

const OPTIONS_TYPENAME = 'sse_stocklist';

// 分析数据
async function func_analysis(crawler) {
    crawler.da.data('script').each((index, element) => {
        let obj = cheerio(element);
        let src = obj.attr('src');
        if (src != undefined && src.indexOf('ssesuggestdata.js') > 0) {
            // startStockListJSCrawler('http://www.sse.com.cn' + src);
            startStockListJSCrawler(src);
        }

        return true;
    });

    return crawler;
}

// function func_getcache(options) {
//     return CrawlerMgr.singleton.getOptionsCache_default(options);
// }
//
// function func_setcache(options, cache) {
//     CrawlerMgr.singleton.setOptionsCache_default(options, cache);
// }

let stocklistOptions = {
    typename: OPTIONS_TYPENAME,
    // 主地址
    uri: 'http://www.sse.com.cn/assortment/stock/list/share/',
    timeout: 30 * 1000,

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 分析数据
    func_analysis: func_analysis
};

function startStockListCrawler() {
    let op = Object.assign({}, stocklistOptions);
    CrawlerMgr.singleton.addCrawler(op);
}

exports.stocklistOptions = stocklistOptions;
exports.startStockListCrawler = startStockListCrawler;

CrawlerMgr.singleton.regOptions(OPTIONS_TYPENAME, () => {
    let options = Object.assign({}, stocklistOptions);
    return options;
});