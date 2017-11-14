"use strict";

let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE, getVal_CDPCallFrame, HeadlessChromeMgr } = require('crawlercore');
let util = require('util');
let fs = require('fs');
let moment = require('moment');
const iconv = require('iconv-lite');
let { StockMgr } = require('./stockmgr');

const OPTIONS_TYPENAME = 'sina_stockpriceday';

// 分析数据
async function func_analysis(crawler) {
    return crawler;
}

let sinapricedayOptions = {
    typename: OPTIONS_TYPENAME,
    // 主地址
    uri: 'http://vip.stock.finance.sina.com.cn/corp/go.php/vMS_MarketHistory/stockid/600030.phtml?year=2003&jidu=1',
    timeout: 30 * 1000,

    force_encoding: 'gbk',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 分析数据
    func_analysis: func_analysis
};

async function startStockPriceDayCrawler(code, beginday, endday) {
    let sd = moment(beginday);
    let ed = moment(endday);
    let sy = sd.format('YYYY');
    let ey = ed.format('YYYY');
    let sq = sd.format('Q');
    let eq = ed.format('Q');

    for (let cy = sy; cy <= ey; ++cy) {
        let ceq = 4;
        if (cy == ey) {
            ceq = eq;
        }

        for (let cq = sq; cq <= ceq; ++cq) {
            let op = Object.assign({}, sinajymx2Options);
            op.uri = util.format('http://vip.stock.finance.sina.com.cn/corp/go.php/vMS_MarketHistory/stockid/%s.phtml?year=d&jidu=%d', code, cy, cq);
            await CrawlerMgr.singleton.addCrawler(op);
        }

        sq = 1;
    }
}

CrawlerMgr.singleton.regOptions(OPTIONS_TYPENAME, () => {
    let options = Object.assign({}, sinapricedayOptions);
    return options;
});

exports.startStockPriceDayCrawler = startStockPriceDayCrawler;
// exports.startAllStockToday2Crawler = startAllStockToday2Crawler;