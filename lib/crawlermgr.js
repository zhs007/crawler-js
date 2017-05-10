"use strict";

let {CRAWLER, DATAANALYSIS, STORAGE} = require('./basedef');

class CrawlerMgr {

    constructor() {
        this.mapCrawler = {};
        this.mapDA = {};
        this.mapStorage = {};
    }

    // funcNew(options)
    regCrawler(crawlertype, funcNew) {
        this.mapCrawler[crawlertype] = funcNew;
    }

    // funcNew(crawler)
    regDataAnalysis(datype, funcNew) {
        this.mapDA[datype] = funcNew;
    }

    // funcNew(crawler)
    regStorage(storagetype, funcNew) {
        this.mapStorage[storagetype] = funcNew;
    }

    // start Crawler
    async startCrawler(options) {
        let crawlertype = CRAWLER.REQUEST;
        let datype = DATAANALYSIS.NULL;
        let storagetype = STORAGE.NULL;

        if (options.hasOwnProperty('crawler_type')) {
            crawlertype = options.crawler_type;
        }

        if (options.hasOwnProperty('dataanalysis_type')) {
            datype = options.dataanalysis_type;
        }

        if (options.hasOwnProperty('storage_type')) {
            storagetype = options.storage_type;
        }

        let crawler = this.mapCrawler[crawlertype](options);
        let storage = this.mapStorage[storagetype](crawler);

        await crawler.start().then(crawler => {
            if (datype != DATAANALYSIS.NULL) {
                let da = this.mapDA[datype](crawler);
                da.onAnalysis();
            }
        });

        return crawler;
    }
};

exports.singleton = new CrawlerMgr();