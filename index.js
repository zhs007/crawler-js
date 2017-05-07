"use strict";

require('./lib/allcrawler');
let crawlerdef = require('./lib/crawlerdef');
let CrawlerMgr = require('./lib/crawlermgr');

function newCrawler(crawlertype, options) {
    return CrawlerMgr.singleton.newCrawler(crawlertype, options);
}

exports.newCrawler = newCrawler;

for (let ct in crawlerdef) {
    exports[ct] = crawlerdef[ct];
}

