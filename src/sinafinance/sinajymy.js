"use strict";

let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE, getVal_CDPCallFrame, HeadlessChromeMgr } = require('crawlercore');
let util = require('util');
let moment = require('moment');
let { StockMgr } = require('./stockmgr');

const OPTIONS_TYPENAME = 'sina_jymx';

// 分析数据
async function func_analysis(crawler) {
    const { Page, Runtime, Debugger, Network } = crawler.client;

    await Promise.all([
        Page.enable(),
        Debugger.enable(),
        Network.enable()
    ]);

    // Page.loadEventFired((params) => {
    //     console.log("on window", params);
    // });

    // Page.lifecycleEvent((params) => {
    //     console.log("on window", params);
    // });

    Page.frameAttached((params) => {
        console.log("on window", params);
    });

    // Page.windowOpen((params) => {
    //     console.log("on window", params.url);
    // });

    // Network.responseReceived((params) => {
    //     if (params.response.url.indexOf('xls') >= 0) {
    //         console.log("got script ID", params.requestId);
    //     }
    // });

    await Page.navigate({url: crawler.options.uri});
    // const result = await Runtime.evaluate({
    //     expression: 'document.documentElement.outerHTML'
    // });
    //
    await Page.loadEventFired();
    // const result1 = await Runtime.evaluate({
    //     expression: 'document.documentElement.outerHTML'
    // });

    HeadlessChromeMgr.singleton.closeTab(crawler.client);

    return crawler;
}

let sinajymxOptions = {
    typename: OPTIONS_TYPENAME,
    // 主地址
    uri: 'http://market.finance.sina.com.cn/downxls.php?date=2017-10-25&symbol=sh600000',
    timeout: 30 * 1000,

    // 爬虫类型
    crawler_type: CRAWLER.HEADLESSCHROME,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.NULL,

    // 分析数据
    func_analysis: func_analysis,

    headlesschromename: ''
};

async function startJYMXCrawler(code, beginday, endday, hcname) {
    let sd = moment(beginday);
    let ed = moment(endday);

    while (sd.isBefore(ed)) {
        let curday = sd.format('YYYY-MM-DD');

        let op = Object.assign({}, sinajymxOptions);
        op.uri = util.format('http://market.finance.sina.com.cn/downxls.php?date=%s&symbol=%s', curday, code);
        // op.uri = util.format('http://quotes.sina.cn/hs/company/quotes/view/%s/?from=wap', code);
        op.headlesschromename = hcname;
        // op.code = code.substr(code.length - 6, 6);
        await CrawlerMgr.singleton.addCrawler(op);

        sd = sd.add(1, 'days');
    }
}

// function startAllStockToday2Crawler(hcname) {
//     for (let code in StockMgr.singleton.mapStock) {
//         if (code.charAt(0) == '0' && code.charAt(1) == '9') {
//             continue;
//         }
//
//         if (code.charAt(0) == '1' && code.charAt(1) == '0') {
//             continue;
//         }
//
//         let fcode = StockMgr.singleton.mapStock[code].bourse.toLowerCase() + code;
//         startStockToday2Crawler(fcode, hcname);
//     }
// }

CrawlerMgr.singleton.regOptions(OPTIONS_TYPENAME, () => {
    let options = Object.assign({}, sinajymxOptions);
    return options;
});

exports.startJYMXCrawler = startJYMXCrawler;
// exports.startAllStockToday2Crawler = startAllStockToday2Crawler;