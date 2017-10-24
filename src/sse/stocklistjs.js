"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let {StockMgr} = require('./stockmgr');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');

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
    crawler.da.runScript('var lst = get_data();');
    let lst = crawler.da.context.lst;

    for (let i = 0; i < lst.length; ++i) {
        if (!StockMgr.singleton.isAlreadyInDB(lst[i].val)) {
            StockMgr.singleton.addStock(lst[i].val, lst[i].val2, lst[i].val3);

            console.log(lst[i]);
        }
    }

    // crawler.da.data('script').each((index, element) => {
    //     let obj = cheerio(element);
    //     let src = obj.attr('src');
    //     if (src != undefined && src.indexOf('ssesuggestdata')) {
    //
    //     }
    //
    //     return true;
    // });

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