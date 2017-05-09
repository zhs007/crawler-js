"use strict";

let crawlerjs = require('../index');

crawlerjs.startCrawler(crawlerjs.CRAWLERTYPE_REQUEST, crawlerjs.DATAANALYSIS_CHEERIO, {
    uri: 'http://fund.jrj.com.cn/family.shtml',
    resolveWithFullResponse: false
}).then(crawler => {
    //console.log(crawler.da.data('[href]'));

    // let arr = crawler.da.data('[href]');
    // for (let ii = 0; ii < arr.length; ++ii) {
    //     console.log(arr[ii].attr('href'));
    // }

    crawler.da.data('[href]').each((index, element) => {
        console.log(element.attribs.href);

        return true;
    });
});



