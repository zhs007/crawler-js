"use strict";

let process = require('process');
let moment = require('moment');
let fs = require('fs');
let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE } = require('crawlercore');
let { startStockListCrawler } = require('../src/sse/stocklist');
let { addAllStockPriceMCrawler } = require('../src/sse/stockpricem');
let { addAllStockPriceDCrawler } = require('../src/sse/stockpriced');
let { StockMgr } = require('../src/sse/stockmgr');

const rediscfg = JSON.parse(fs.readFileSync('./rediscfg_hfdb.json').toString());
const REDISID_CACHE = 'cache';

CrawlerMgr.singleton.addRedisCfg(REDISID_CACHE, rediscfg);
CrawlerMgr.singleton.setCrawlerCache(CRAWLERCACHE.REDIS, REDISID_CACHE);

const mysqlcfg = JSON.parse(fs.readFileSync('./mysqlcfg_hfdb.json').toString());
const MYSQLID_HFDB = 'hfdb';
mysqlcfg.multipleStatements = true;

CrawlerMgr.singleton.addMysqlCfg(MYSQLID_HFDB, mysqlcfg);

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

CrawlerMgr.singleton.processCrawlerNums = 8;
CrawlerMgr.singleton.processDelayTime = 0.3;

let curday = moment().format('YYYY-MM-DD');
// let startday = moment().subtract(15, 'days').format('YYYY-MM-DD');

// let endday = '2017-10-23';
// let startday = '2009-01-01';

CrawlerMgr.singleton.init().then(() => {
    StockMgr.singleton.init(MYSQLID_HFDB).then(async () => {
         startStockListCrawler();

        // await StockMgr.singleton.delStockPriceD(curday);
        // await StockMgr.singleton.delStockPriceM(curday);
        //
        // addAllStockPriceMCrawler('jQuery1112040217566662998494');
        // addAllStockPriceDCrawler('jQuery1112040217566662998494');

        CrawlerMgr.singleton.start(true, true, async () => {
            await StockMgr.singleton.saveStockBase();
        }, true);
    });
});
