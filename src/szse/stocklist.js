"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');
let { startStockListPostCrawler } = require('./stocklistpost');

const OPTIONS_TYPENAME = 'szse_stocklist';

function fixstr(str) {
    return str.replace(/['" ]/g, '');
}

// 分析数据
async function func_analysis(crawler) {
    let param0 = 0;
    let param1 = 0;
    let param2 = 0;
    let param3 = 0;
    let param4 = 0;

    crawler.da.data('.cls-navigate-next').each((index, element) => {
        try {
            let obj = cheerio(element);
            let str = obj.attr('onclick');

            let arr0 = str.split('(');
            let arr1 = arr0[1].split(',');

            param0 = fixstr(arr1[0]);
            param1 = fixstr(arr1[1]);
            param2 = fixstr(arr1[2]);
            param3 = fixstr(arr1[3]);

            let arr2 = arr1[4].split(')');
            param4 = fixstr(arr2[0]);
        }
        catch(err) {
            console.log('err ' + crawler.options.uri + ' ' + err.toString());
        }

        return true;
    });

    for (let i = 0; i < param3; ++i) {
        await startStockListPostCrawler(param0, param1, i + 1, param3, param4);
    }

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
    uri: 'http://www.szse.cn/main/marketdata/jypz/colist/',
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