"use strict";

let {STORAGE} = require('./basedef');
let CrawlerMgr = require('./crawlermgr');

class Storage {
    constructor(crawler) {
        this.crawler = crawler;
        this.data = [];

        crawler.storage = this;
    }

    async onSave() {
        return this.crawler;
    }

    pushData(data) {
        this.data.push(data);
    }
};

CrawlerMgr.singleton.regStorage(STORAGE.NULL, function (crawler) {
    return new Storage(crawler);
});

exports.Storage = Storage;