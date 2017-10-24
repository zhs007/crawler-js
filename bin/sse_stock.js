"use strict";

let process = require('process');
let moment = require('moment');
let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let {startStockListCrawler} = require('../src/sse/stocklist');
let {StockMgr} = require('../src/sse/stockmgr');

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

CrawlerMgr.singleton.processCrawlerNums = 8;
CrawlerMgr.singleton.processDelayTime = 0.3;

let endday = moment().format('YYYY-MM-DD');
let startday = moment().subtract(15, 'days').format('YYYY-MM-DD');

// let endday = '2017-10-23';
// let startday = '2009-01-01';

StockMgr.singleton.init().then(() => {
    startStockListCrawler();
    CrawlerMgr.singleton.start(true, true, async () => {
        await StockMgr.singleton.saveStockBase();
    }, true);
});
