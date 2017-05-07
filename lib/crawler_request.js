"use strict";

let crawlerdef = require('./crawlerdef');
let Crawler = require('./crawler').Crawler;
let CrawlerMgr = require('./crawlermgr');
let rp = require('request-promise');
let cheerio = require('cheerio');

class Crawler_Request extends Crawler {

    constructor(options) {
        super(options);
    }

    async start() {
        let self = this;

        await rp(self.options)
            .then(function (data) {
                self.onProcess(data);
            })
            .catch(function (err) {
                self.onError(err);
            });

        return self;
    }
};

CrawlerMgr.singleton.regCrawler(crawlerdef.CRAWLERTYPE_REQUEST, function (options) {
    return new Crawler_Request(options);
});

exports.Crawler_Request = Crawler_Request;