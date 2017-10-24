"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let {StockMgr} = require('./stockmgr');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');

function proctimeval(curday, val) {
    let h = Math.floor(val / 10000);
    let m = Math.floor((val - h * 10000) / 100);
    if (h < 10) {
        h = '0' + h.toString();
    }
    if (m < 10) {
        m = '0' + m.toString();
    }

    return util.format('%s %s:%s:00', curday, h, m);
}

// 分析数据
async function func_analysis(crawler) {
    let code = util.format("var retobj = undefined;\nfunction %s(obj) { retobj = obj; }", crawler.options.funcname);
    crawler.da.runScript(code);
    crawler.da.runCurCode();
    let retobj = crawler.da.context.retobj;

    if (retobj != undefined) {
        let lst = [];
        let curday = moment(retobj.date, 'YYYYMMDD').format('YYYY-MM-DD');
        for (let i = 0; i < retobj.line.length; ++i) {
            let curobj = {
                code: crawler.options.stockcode,
                price: Math.floor(retobj.line[i][1] * 10000),
                volume: retobj.line[i][2],
                timem: proctimeval(curday, retobj.line[i][0])
            };

            lst.push(curobj);
        }

        await StockMgr.singleton.saveStockPriceM(crawler.options.stockcode, lst, curday);
    }

    return crawler;
}

let stockpricemOptions = {
    // 主地址
    uri: 'http://yunhq.sse.com.cn:32041/v1/sh1/line/600000?callback=jQuery1112040217566662998494_1508823257330&begin=0&end=-1&select=time%2Cprice%2Cvolume&_=1508823257415',
    timeout: 30 * 1000,

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.JAVASCRIPT,

    // 分析数据
    func_analysis: func_analysis
};

function addStockPriceMCrawler(code, funcname) {
    let curms = moment().format('x');
    let op = Object.assign({}, stockpricemOptions);
    op.uri = util.format("http://yunhq.sse.com.cn:32041/v1/sh1/line/%d?callback=%s_%d&begin=0&end=-1&select=time%2Cprice%2Cvolume&_=%d", code, funcname, curms, curms);
    op.funcname = funcname + '_' + curms;
    op.stockcode = code;
    CrawlerMgr.singleton.addCrawler(op);
}

function addAllStockPriceMCrawler(funcname) {
    for (let code in StockMgr.singleton.mapStock) {
        addStockPriceMCrawler(code, funcname);
    }
}

exports.stockpricemOptions = stockpricemOptions;
exports.addStockPriceMCrawler = addStockPriceMCrawler;
exports.addAllStockPriceMCrawler = addAllStockPriceMCrawler;