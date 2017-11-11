"use strict";

let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, HeadlessChromeMgr, getDocumentText_CDP } = require('crawlercore');
let { StockMgr } = require('./stockmgr');
let moment = require('moment');
let util = require('util');

const PAGELEN = 30;

// 分析数据
async function func_analysis(crawler) {
    if (crawler.options.pageindex == 1) {
        await getDocumentText_CDP('https://xueqiu.com/hq#exchange=CN&firstName=1&secondName=1_0&page=1', crawler.client);
    }

    let str = await getDocumentText_CDP(crawler.options.uri, crawler.client);
    let obj = JSON.parse(str);
    if (crawler.options.pageindex == 1) {
        let maxpage = Math.ceil(obj.count.count / PAGELEN);
        for (let i = 2; i < maxpage; ++i) {
            startStockListCrawler(i);
        }
    }

    for (let j = 0; j < obj.stocks.length; ++j) {
        let code = obj.stocks[j].symbol.substr(obj.stocks[j].symbol.length - 6, 6);
        let bourse = obj.stocks[j].symbol.substr(0, 2);
        if (!StockMgr.singleton.isAlreadyInDB(code)) {
            StockMgr.singleton.addStock(code, obj.stocks[j].name, bourse, false);
        }
    }

    HeadlessChromeMgr.singleton.closeTab(crawler.client);

    return crawler;
}

let stocklistOptions = {
    // 主地址
    uri: 'https://xueqiu.com/stock/cata/stocklist.json?page=1&size=30&order=desc&orderby=percent&type=11%2C12&_=123',
    timeout: 30 * 1000,

    // 爬虫类型
    crawler_type: CRAWLER.HEADLESSCHROME,

    // headers: {
    //     'Accept': 'application/json, text/javascript, */*; q=0.01',
    //     'Accept-Encoding': 'gzip, deflate, br',
    //     'Accept-Language': 'zh,en-US;q=0.8,en;q=0.6',
    //     'Cache-Control': 'no-cache',
    //     'Connection': 'keep-alive',
    //     'Cookie': 'aliyungf_tc=AQAAAE/avXaJcQwA2ooTGxyuYRpj7+xJ; s=fd1261f9r4; device_id=a35d708925ba89a86099733b901645d9; webp=1; xq_a_token=6708d101a456578c98ea1779ae898687fe465bcb; xq_a_token.sig=ESOIvUPuIgPljw2oVadQTbSmYos; xq_r_token=0cbb786896425c8f2a853545bade9309fbc75601; xq_r_token.sig=SBPl2y3rvUjypwJrgx4MSiUpxWw; u=371510320169928; __utmt=1; __utma=1.571230246.1507814965.1508162096.1510320224.3; __utmb=1.1.10.1510320224; __utmc=1; __utmz=1.1507814965.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); Hm_lvt_1db88642e346389874251b5a1eded6e3=1508587284,1508683246,1508683375,1510320170; Hm_lpvt_1db88642e346389874251b5a1eded6e3=1510320224',
    //     'Host': 'xueqiu.com',
    //     'Pragma': 'no-cache',
    //     'Referer': 'https://xueqiu.com/hq',
    //     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
    //     'X-Requested-With': 'XMLHttpRequest',
    // },

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.NULL,

    // 分析数据
    func_analysis: func_analysis,

    headlesschromename: ''
};

function startStockListCrawler(pageindex, hcname) {
    let curms = moment().format('x');
    let op = Object.assign({}, stocklistOptions);
    op.uri = util.format('https://xueqiu.com/stock/cata/stocklist.json?page=%d&size=%d&order=desc&orderby=percent&type=11%2C12&_=%d', pageindex, PAGELEN, curms);
    op.pageindex = pageindex;
    op.headlesschromename = hcname;
    CrawlerMgr.singleton.addCrawler(op);
}

exports.stocklistOptions = stocklistOptions;
exports.startStockListCrawler = startStockListCrawler;