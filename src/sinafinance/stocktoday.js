"use strict";

let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE, getVal_CDPCallFrame, HeadlessChromeMgr } = require('crawlercore');
let util = require('util');
let { StockMgr } = require('./stockmgr');

const OPTIONS_TYPENAME = 'sina_stocktoday';

// 分析数据
async function func_analysis(crawler) {
    const { Page, Runtime, Debugger, Network } = crawler.client;

    Debugger.paused(async (params) => {

        let obj = await getVal_CDPCallFrame('h', params.callFrames, Runtime);
        console.log('headlesschrome2 ' + JSON.stringify(obj));

        let curday = obj.data.td1[0].today;
        let lst = [];
        for (let i = 0; i <= 240; ++i) {
            let co = {
                code: crawler.options.code,
                price: obj.data.td1[i].price * 10000,
                avg_price: obj.data.td1[i].avg_price * 10000,
                valume: obj.data.td1[i].valume * 10000,
                timem: curday + ' ' + obj.data.td1[i].time
            };

            lst.push(co);
        }

        StockMgr.singleton.saveStockPriceM(crawler.options.code, lst, curday);

        Debugger.resume();
        crawler.client.close();
        // crawler.launcher.kill();
    });

    Debugger.scriptParsed((params) => {
        if ('http://finance.sina.com.cn/sinafinancesdk/js/chart/h5t.js' == params.url) {
            Debugger.getScriptSource({'scriptId': params.scriptId}, (err, msg) => {
                if (err) {
                    return;
                }

                let ci = msg.scriptSource.indexOf('window["KLC_ML_"+a]=null;');
                let loc = {
                    scriptId: params.scriptId,
                    lineNumber: 0,
                    columnNumber: ci
                };

                Debugger.setBreakpoint({location: loc}, (err, params1) => {
                    console.log("params1 : " + JSON.stringify(params1));
                });
            });
        }
    });

    await Promise.all([
        Page.enable(),
        Debugger.enable(),
        Network.enable()
    ]);

    await Page.navigate({url: crawler.options.uri});
    await Page.loadEventFired();

    return crawler;
}

let headlesschrome2Options = {
    typename: OPTIONS_TYPENAME,
    // 主地址
    uri: 'http://quotes.sina.cn/hs/company/quotes/view/sh600000/?from=wap',
    timeout: 30 * 1000,

    // 爬虫类型
    crawler_type: CRAWLER.HEADLESSCHROME,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.NULL,

    // 分析数据
    func_analysis: func_analysis,

    headlesschromename: ''
};

function startStockToday2Crawler(code, hcname) {
    let op = Object.assign({}, headlesschrome2Options);
    op.uri = util.format('http://quotes.sina.cn/hs/company/quotes/view/%s/?from=wap', code);
    op.headlesschromename = hcname;
    op.code = code.substr(code.length - 6, 6);
    CrawlerMgr.singleton.addCrawler(op);
}

CrawlerMgr.singleton.regOptions(OPTIONS_TYPENAME, () => {
    let options = Object.assign({}, headlesschrome2Options);
    return options;
});

exports.startStockToday2Crawler = startStockToday2Crawler;