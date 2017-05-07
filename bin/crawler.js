"use strict";

let crawlerjs = require('../index');

let curCrawler = crawlerjs.newCrawler(crawlerjs.CRAWLERTYPE_REQUEST, {
    uri: 'http://fund.jrj.com.cn/archives,530012,jjjz.shtml',
    resolveWithFullResponse: false
});

curCrawler.start().then(function (crawler) {
    console.log(crawler.data);
});