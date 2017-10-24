"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');
let {startStockListJSCrawler} = require('./stocklistjs');

function analysisNode(crawler, element) {
    let arr = [];
    cheerio('td.aa', element).each((ci, cele) => {
        let obj = cheerio(cele);
        arr.push(obj.text());
    });

    let curfund = {
        code: arr[1],
        name: arr[0],
        acttype: arr[2],
        type: arr[3],
        company: arr[4],
        trustee: arr[5],
        startday: arr[6],
        endday: arr[7]
    };

    crawler.options.fundmap[curfund.code] = curfund;

    console.log(util.format('fund %s %s %s %s %s %s %s %s', curfund.code, curfund.name, curfund.acttype, curfund.type, curfund.company, curfund.trustee, curfund.startday, curfund.endday));

    FundMgr.singleton.addFund(crawler.options.curfund.code, crawler.options.curfund.name, crawler.options.curfund.uri,
        curfund.company, curfund.acttype, curfund.type, curfund.trustee, curfund.startday, curfund.endday, false);

    return ;
}

// 分析数据
async function func_analysis(crawler) {
    crawler.da.data('script').each((index, element) => {
        let obj = cheerio(element);
        let src = obj.attr('src');
        if (src != undefined && src.indexOf('ssesuggestdata.js') > 0) {
            startStockListJSCrawler('http://www.sse.com.cn' + src);
        }

        return true;
    });

    return crawler;
}

let stocklistOptions = {
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