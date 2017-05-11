"use strict";

let {CRAWLER, DATAANALYSIS, STORAGE} = require('./basedef');

class CrawlerMgr {

    constructor() {
        this.mapCrawler = {};
        this.mapDA = {};
        this.mapStorage = {};

        this.lstCrawler = [];
        this.lstCrawlerRuning = [];
        this.processCrawlerNums = 1;    // 同时处理的任务数量
        this.processDelayTime = 30;     // 每个任务处理间隔时间，秒
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

    _delay(delay) {
        return new Promise((resolve) => {
            setTimeout(resolve, delay * 1000);
        });
    }

    async _onAddCrawler(crawler) {
        if (this.lstCrawlerRuning.length < this.processCrawlerNums) {
            await this._startCrawler(crawler);
        }
        else {
            this.lstCrawler.push(crawler);
        }

        return crawler;
    }

    async _onEndCrawler(crawler) {
        let ci = this.lstCrawlerRuning.indexOf(crawler);
        if (ci >= 0) {
            this.lstCrawlerRuning.splice(ci, 1);
        }

        if (this.lstCrawler.length > 0) {
            let ncrawler = this.lstCrawler[0];
            this.lstCrawler.splice(0, 1);

            await this._startCrawler(ncrawler);

            return ncrawler;
        }

        return undefined;
    }

    async _startCrawler(crawler) {
        this.lstCrawlerRuning.push(crawler);

        console.log('start crawler ' + crawler.options.uri);

        await crawler.start().then(async crawler => {
            if (crawler.options.dataanalysis_type != DATAANALYSIS.NULL) {
                let da = this.mapDA[crawler.options.dataanalysis_type](crawler);
                da.onAnalysis();
            }

            if (crawler.options.func_analysis != undefined) {
                await crawler.options.func_analysis(crawler);
            }

            return crawler;
        });

        await this._delay(this.processDelayTime);
        await this._onEndCrawler(crawler);

        return crawler;
    }

    // start Crawler
    async startCrawler(options) {
        let crawlertype = CRAWLER.REQUEST;
        let datype = DATAANALYSIS.NULL;
        let storagetype = STORAGE.NULL;

        if (options.hasOwnProperty('crawler_type')) {
            crawlertype = options.crawler_type;
        }
        else {
            options.crawler_type = crawlertype;
        }

        if (options.hasOwnProperty('dataanalysis_type')) {
            datype = options.dataanalysis_type;
        }
        else {
            options.dataanalysis_type = datype;
        }

        if (options.hasOwnProperty('storage_type')) {
            storagetype = options.storage_type;
        }
        else {
            options.storage_type = storagetype;
        }

        let crawler = this.mapCrawler[crawlertype](options);
        let storage = this.mapStorage[storagetype](crawler);

        await this._onAddCrawler(crawler);

        return crawler;
    }
};

exports.singleton = new CrawlerMgr();