"use strict";

let process = require('process');
let moment = require('moment');
let fs = require('fs');
let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE, getVal_CDPCallFrame, HeadlessChromeMgr } = require('crawlercore');
let util = require('util');
let { startAllStockToday2Crawler, startStockToday2Crawler_List } = require('../src/sinafinance/stocktoday');
let { startStockListCrawler } = require('../src/sinafinance/xueqiustacklist');
let { StockMgr } = require('../src/sinafinance/stockmgr');
let { startJYMX2Crawler } = require('../src/sinafinance/sinajymx2');
let { startAllStockPriceDayCrawler } = require('../src/sinafinance/stockpriceday');

const HEADLESSCHROME_NAME = 'hc';
const HEADLESSCHROME_OPTION = {
    port: 9222,
    autoSelectChrome: true,
    additionalFlags: ['--window-size=1136,640', '--disable-gpu', '--headless']
};

HeadlessChromeMgr.singleton.addHeadlessChrome(HEADLESSCHROME_NAME, HEADLESSCHROME_OPTION);

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
});

CrawlerMgr.singleton.processCrawlerNums = 1;
CrawlerMgr.singleton.processDelayTime = 2;

let curday = moment().format('YYYY-MM-DD');
// let startday = moment().subtract(15, 'days').format('YYYY-MM-DD');

// let endday = '2017-10-23';
// let startday = '2009-01-01';

CrawlerMgr.singleton.init().then(() => {
    StockMgr.singleton.init(MYSQLID_HFDB).then(async () => {

        await HeadlessChromeMgr.singleton.getHeadlessChrome(HEADLESSCHROME_NAME);

        // startStockListCrawler(1, HEADLESSCHROME_NAME);

        // await StockMgr.singleton.delStockPriceM(curday);
        // startAllStockToday2Crawler(HEADLESSCHROME_NAME);

        // let lst = await StockMgr.singleton.getTodayStock();
        // let rlst = StockMgr.singleton.reselectStock(lst);
        // startStockToday2Crawler_List(rlst, HEADLESSCHROME_NAME);

        // await startJYMX2Crawler('sh600000', '2005-01-01', '2017-11-12', HEADLESSCHROME_NAME);

        await startAllStockPriceDayCrawler('2016-01-01', '2017-12-31');

        CrawlerMgr.singleton.start(true, true, async () => {
            // await StockMgr.singleton.saveStockBase();

            // console.log(StockMgr.singleton.lstStockToday);

        }, true);
    });
});