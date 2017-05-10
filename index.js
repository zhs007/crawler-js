"use strict";

require('./lib/crawler_request');
require('./lib/crawler_headlesschrome');

require('./lib/da_cheerio');

let basedef = require('./lib/basedef');
let CrawlerMgr = require('./lib/crawlermgr');

//require('./lib/headlesschrome');

// options
//      - uri: string
//      - auto_encoding: bool

async function startCrawler(crawlertype, datype, options) {
    return CrawlerMgr.singleton.startCrawler(crawlertype, datype, options);
}

exports.startCrawler = startCrawler;

for (let ct in basedef) {
    exports[ct] = basedef[ct];
}

