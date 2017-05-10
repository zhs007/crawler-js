"use strict";

let crawlerjs = require('../index');
var iconv = require('iconv-lite');

crawlerjs.startCrawler(crawlerjs.CRAWLERTYPE_REQUEST, crawlerjs.DATAANALYSIS_CHEERIO, {
    uri: 'http://fund.jrj.com.cn/family.shtml',
    autoencode: true
}).then(crawler => {
    //console.log(crawler.da.data('[href]'));

    // let arr = crawler.da.data('[href]');
    // for (let ii = 0; ii < arr.length; ++ii) {
    //     console.log(arr[ii].attr('href'));
    // }

    crawler.da.data('[href]').each((index, element) => {
        if (element.name == 'a' && element.attribs.href.indexOf('http://fund.jrj.com.cn/archives,') == 0) {
            console.log(element.attribs.href);

            //let curname = new Buffer(element.attribs.title);
            console.log(element.attribs.title);
            //console.log(curname);
            //console.log(iconv.decode(curname, 'gbk'));
        }

        return true;
    });
});



