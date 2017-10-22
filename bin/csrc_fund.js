"use strict";

let process = require('process');
let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../index');
let {fundnetOptions, addFundNetCrawler} = require('../src/csrc/fundnet');
let {FundMgr} = require('../src/csrc/fundmgr');

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

CrawlerMgr.singleton.processCrawlerNums = 8;
CrawlerMgr.singleton.processDelayTime = 0.3;

FundMgr.singleton.init().then(() => {
    addFundNetCrawler('2009-01-01', '2009-12-31', fundnetOptions);
    CrawlerMgr.singleton.start(true, true, async () => {
        await FundMgr.singleton.saveFundBase();
    }, true);
});
