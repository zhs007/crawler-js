"use strict";

let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE } = require('crawlercore');
let util = require('util');
let fs = require('fs');
let process = require('process');
let mysql = require('mysql2/promise');
let moment = require('moment');
let { FundMgr, FundState } = require('../src/jrj/fundmgr');
let { addTotalFund } = require('../src/jrj/op_totalfund');
let { START_YEAR, END_YEAR, MODE_INITFUNDBASE, MODE_INITFUNDARCH, MODE_UPDFUNDARCH } = require('../src/jrj/basedef');

const CURMODE = MODE_UPDFUNDARCH;

const rediscfg = JSON.parse(fs.readFileSync('./rediscfg_hfdb.json').toString());
const REDISID_CACHE = 'cache';

CrawlerMgr.singleton.addRedisCfg(REDISID_CACHE, rediscfg);
CrawlerMgr.singleton.setCrawlerCache(CRAWLERCACHE.REDIS, REDISID_CACHE);

const mysqlcfg = JSON.parse(fs.readFileSync('./mysqlcfg_hfdb.json').toString());
const MYSQLID_HFDB = 'hfdb';
mysqlcfg.multipleStatements = true;

CrawlerMgr.singleton.addMysqlCfg(MYSQLID_HFDB, mysqlcfg);


//CrawlerMgr.singleton.startHeapdump(10000);
//CrawlerMgr.singleton.startMemWatch();

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

CrawlerMgr.singleton.processCrawlerNums = 8;
CrawlerMgr.singleton.processDelayTime = 0.3;

CrawlerMgr.singleton.init().then(() => {
    FundMgr.singleton.init(MYSQLID_HFDB).then(() => {

        addTotalFund(CURMODE);

        CrawlerMgr.singleton.start(true, true, async () => {
            FundState.singleton.output();

            if (CURMODE == MODE_INITFUNDBASE) {
                await FundMgr.singleton.saveFundBase();
            }

        }, true);
    });
});
