"use strict";

let process = require('process');
let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../index');
let {companyOptions} = require('../src/csrc/company');
let {fundnetOptions, addFundNetCrawler} = require('../src/csrc/fundnet');
let {FundMgr} = require('../src/csrc/fundmgr');

let fundmgr = new FundMgr();
companyOptions.fundmgr = fundmgr;
fundnetOptions.fundmgr = fundmgr;

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

CrawlerMgr.singleton.processCrawlerNums = 8;
CrawlerMgr.singleton.processDelayTime = 0.3;

addFundNetCrawler('2017-10-01', '2017-10-21', fundnetOptions);

// CrawlerMgr.singleton.addCrawler(fundnetOptions);
CrawlerMgr.singleton.start(true, true, async () => {

}, true);
