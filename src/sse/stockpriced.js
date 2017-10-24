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
        let curday = moment(retobj.date, 'YYYYMMDD').format('YYYY-MM-DD');
        let curobj = {
            code: crawler.options.stockcode,
            openprice: Math.floor(retobj.snap[7] * 100),
            endprice: Math.floor(retobj.snap[1] * 100),
            minprice: Math.floor(retobj.snap[11] * 100),
            maxprice: Math.floor(retobj.snap[10] * 100),
            volume: retobj.snap[5] * 100,
            daymoney: retobj.snap[4] * 100,
            timed: curday
        };

        let sell = retobj.snap[8];
        let buy = retobj.snap[9];

        for (let i = 0; i < sell.length; ++i) {
            let ci = Math.floor(i / 2);
            if (i % 2 == 0) {
                curobj['sell_p' + ci] = Math.floor(sell[i] * 100);
            }
            else {
                curobj['sell_v' + ci] = sell[i];
            }
        }

        for (let i = 0; i < buy.length; ++i) {
            let ci = Math.floor(i / 2);
            if (i % 2 == 0) {
                curobj['buy_p' + ci] = Math.floor(buy[i] * 100);
            }
            else {
                curobj['buy_v' + ci] = buy[i];
            }
        }

        // console.log(curobj);
        await StockMgr.singleton.saveStockPriceD(crawler.options.stockcode, curobj, curday);
    }

    return crawler;
}

let stockpricedOptions = {
    // 主地址
    uri: 'http://yunhq.sse.com.cn:32041/v1/sh1/snap/600000?callback=jQuery1112040217566662998494_1508823257329&select=name%2Clast%2Cchg_rate%2Cchange%2Camount%2Cvolume%2Copen%2Cprev_close%2Cask%2Cbid%2Chigh%2Clow%2Ctradephase&_=1508823257898',
    timeout: 30 * 1000,

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.JAVASCRIPT,

    // 分析数据
    func_analysis: func_analysis
};

function addStockPriceDCrawler(code, funcname) {
    let curms = moment().format('x');
    let op = Object.assign({}, stockpricedOptions);
    op.uri = util.format("http://yunhq.sse.com.cn:32041/v1/sh1/snap/%d?callback=%s_%d&select=name%2Clast%2Cchg_rate%2Cchange%2Camount%2Cvolume%2Copen%2Cprev_close%2Cask%2Cbid%2Chigh%2Clow%2Ctradephase&_=%d", code, funcname, curms, curms);
    op.funcname = funcname + '_' + curms;
    op.stockcode = code;
    CrawlerMgr.singleton.addCrawler(op);
}

function addAllStockPriceDCrawler(funcname) {
    for (let code in StockMgr.singleton.mapStock) {
        addStockPriceDCrawler(code, funcname);
    }
}

exports.stockpricedOptions = stockpricedOptions;
exports.addStockPriceDCrawler = addStockPriceDCrawler;
exports.addAllStockPriceDCrawler = addAllStockPriceDCrawler;