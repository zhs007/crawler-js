"use strict";

let process = require('process');
let moment = require('moment');
let fs = require('fs');
let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE } = require('crawlercore');
let { fundnetOptions, addFundNetCrawler } = require('../src/csrc/fundnet');
let { FundMgr } = require('../src/csrc/fundmgr');

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

let endday = moment().format('YYYY-MM-DD');
let startday = '2009-01-01';
let startday_unitnet = moment(startday, 'YYYY-MM-DD').subtract(30, 'days').format('YYYY-MM-DD');

CrawlerMgr.singleton.init().then(async () => {
    await FundMgr.singleton.init(MYSQLID_HFDB);
    //await FundMgr.singleton.initFactor_unitnet(startday, endday);
    await FundMgr.singleton.calculateFactor_unitnet(startday_unitnet, endday);

    process.exit();
});
