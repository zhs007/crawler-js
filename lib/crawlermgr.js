"use strict";

class CrawlerMgr {

    constructor() {
        this.map = {};
    }

    // funcNew(options)
    regCrawler(crawlertype, funcNew) {
        this.map[crawlertype] = funcNew;
    }

    // new Crawler
    newCrawler(crawlertype, options) {
        return this.map[crawlertype](options);
    }
};

exports.singleton = new CrawlerMgr();