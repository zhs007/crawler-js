"use strict";

let process = require('process');
let moment = require('moment');
let fs = require('fs');
let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE, getVal_CDPCallFrame, HeadlessChromeMgr } = require('crawlercore');
let util = require('util');
let { startAllStockToday2Crawler } = require('../src/sinafinance/stocktoday');
let { startStockListCrawler } = require('../src/sinafinance/xueqiustacklist');
let { StockMgr } = require('../src/sinafinance/stockmgr');
let { startJYMXCrawler } = require('../src/sinafinance/sinajymy');

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

CrawlerMgr.singleton.processCrawlerNums = 8;
CrawlerMgr.singleton.processDelayTime = 0.3;

let curday = moment().format('YYYY-MM-DD');
// let startday = moment().subtract(15, 'days').format('YYYY-MM-DD');

// let endday = '2017-10-23';
// let startday = '2009-01-01';

CrawlerMgr.singleton.init().then(() => {
    StockMgr.singleton.init(MYSQLID_HFDB).then(async () => {

        await HeadlessChromeMgr.singleton.getHeadlessChrome(HEADLESSCHROME_NAME);

        // startStockListCrawler(1, HEADLESSCHROME_NAME);

        // startAllStockToday2Crawler(HEADLESSCHROME_NAME);

        startJYMXCrawler('600000', HEADLESSCHROME_NAME);

        CrawlerMgr.singleton.start(true, true, async () => {
            // await StockMgr.singleton.saveStockBase();
        }, true);
    });
});