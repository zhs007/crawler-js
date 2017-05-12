"use strict";

require('./lib/crawler_request');
require('./lib/crawler_headlesschrome');

require('./lib/da_cheerio');

require('./lib/storage');
require('./lib/storage_csv');
require('./lib/storage_json');
require('./lib/storage_sql');
require('./lib/storage_mysql');

let {CRAWLER, DATAANALYSIS, STORAGE} = require('./lib/basedef');
let CrawlerMgr = require('./lib/crawlermgr');

// options
//      - uri: string
//      - force_encoding
//      - async func_analysis(crawler)
//      - crawler_type
//      - dataanalysis_type
//      - storage_type
//      - storage_cfg
//      - storage_cfg for csv {filename}
//      - storage_cfg for json {filename}
//      - storage_cfg for sql {filename, func_procline(lineobj)}
//      - storage_cfg for mysql {func_procline(lineobj), mysqlcfg: {host, user, password, database}}

//require('./lib/headlesschrome');

// // options
// //      - uri: string
// //      - auto_encoding: bool
//
// async function startCrawler(crawlertype, datype, options) {
//     return CrawlerMgr.singleton.startCrawler(crawlertype, datype, options);
// }
//
// exports.startCrawler = startCrawler;


exports.CRAWLER = CRAWLER;
exports.DATAANALYSIS = DATAANALYSIS;
exports.STORAGE = STORAGE;
exports.CrawlerMgr = CrawlerMgr;
