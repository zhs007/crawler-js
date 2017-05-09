"use strict";

let basedef = require('./basedef');
let DataAnalysis = require('./dataanalysis').DataAnalysis;
let CrawlerMgr = require('./crawlermgr');
let cheerio = require('cheerio');

class DA_Cheerio extends DataAnalysis {

    constructor(crawler) {
        super(crawler);
    }

    async onAnalysis() {
        this.data = cheerio.load(this.crawler.data);

        return this;
    }
};

CrawlerMgr.singleton.regDataAnalysis(basedef.DATAANALYSIS_CHEERIO, function (crawler) {
    return new DA_Cheerio(crawler);
});

exports.DA_cheerio = DA_Cheerio;