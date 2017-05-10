"use strict";

let {CRAWLER} = require('./basedef');
let Crawler = require('./crawler').Crawler;
let CrawlerMgr = require('./crawlermgr');
let rp = require('request-promise');
var iconv = require('iconv-lite');

class Crawler_Request extends Crawler {

    constructor(options) {
        super(options);

        options.encoding = null;
        options.resolveWithFullResponse = true;
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

    onProcess(data) {
        if (data.headers['content-type'].indexOf('GB2312') >= 0 || data.headers['content-type'].indexOf('GBK') >= 0) {
            super.onProcess(iconv.decode(data.body, 'gbk'));
        }
        else {
            super.onProcess(data.body.toString());
        }
    }
};

CrawlerMgr.singleton.regCrawler(CRAWLER.REQUEST, function (options) {
    return new Crawler_Request(options);
});

exports.Crawler_Request = Crawler_Request;