"use strict";

let process = require('process');
let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../index');
let {CompanyOptions} = require('../src/csrc/company');

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

CrawlerMgr.singleton.processCrawlerNums = 8;
CrawlerMgr.singleton.processDelayTime = 0.3;

CrawlerMgr.singleton.addCrawler(CompanyOptions);
CrawlerMgr.singleton.start(true, true, async () => {

}, true);
