"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../index');
var iconv = require('iconv-lite');
var util = require('util');

CrawlerMgr.singleton.startCrawler({
    uri: 'http://fund.jrj.com.cn/family.shtml',
    crawler_type: CRAWLER.REQUEST,
    dataanalysis_type: DATAANALYSIS.CHEERIO,
    storage_type: STORAGE.SQL,
    storage_cfg: {filename: 'fund.sql', funcLine: ld => {
        return util.format("insert into fundbase(name, code) values('%s', '%s');", ld.name, ld.fundcode);
    }}
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

            let str0 = element.attribs.href.split(',');
            let fundcode = str0[1].split('.')[0];

            crawler.storage.pushData({name: element.attribs.title, url: element.attribs.href, fundcode: fundcode});
        }

        return true;
    });

    crawler.save();
});



