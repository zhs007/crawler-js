"use strict";

let process = require('process');
let moment = require('moment');
let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let {fundnetOptions, addFundNetCrawler} = require('../src/csrc/fundnet');
let {FundMgr} = require('../src/csrc/fundmgr');

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

FundMgr.singleton.init().then(() => {
    addFundNetCrawler(startday, endday, fundnetOptions);
    CrawlerMgr.singleton.start(true, true, async () => {
        await FundMgr.singleton.saveFundBase();
    }, true);
});
