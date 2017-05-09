"use strict";

let basedef = require('./basedef');

class CrawlerMgr {

    constructor() {
        this.map = {};
        this.mapDA = {};
    }

    // funcNew(options)
    regCrawler(crawlertype, funcNew) {
        this.map[crawlertype] = funcNew;
    }

    // funcNew(crawler)
    regDataAnalysis(datype, funcNew) {
        this.mapDA[datype] = funcNew;
    }

    // start Crawler
    async startCrawler(crawlertype, datype, options) {
        let crawler = this.map[crawlertype](options);
        await crawler.start().then(crawler => {
            if (datype != basedef.DATAANALYSIS_NULL) {
                let da = this.mapDA[datype](crawler);
                da.onAnalysis();
            }
        });

        return crawler;
    }
};

exports.singleton = new CrawlerMgr();