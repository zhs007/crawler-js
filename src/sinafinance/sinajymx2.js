"use strict";

let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE, getVal_CDPCallFrame, HeadlessChromeMgr } = require('crawlercore');
let util = require('util');
let fs = require('fs');
let moment = require('moment');
const iconv = require('iconv-lite');
// const csv = require('csv');
let { StockMgr } = require('./stockmgr');

const OPTIONS_TYPENAME = 'sina_jymx2';

// 分析数据
async function func_analysis(crawler) {

    let str = iconv.decode(crawler.data, 'gbk');
    if (str.indexOf('<script') < 0) {
        let lstjymx = [];
        let lstline = str.split('\n');
        for (let ii = 1; ii < lstline.length; ++ii) {
            let curlst = lstline[ii].split('\t');
            let cn = {
                code: crawler.options.code,
                realtime: crawler.options.curday + ' ' + curlst[0],
                price: Math.floor(parseFloat(curlst[1]) * 10000),
                priceoff: Math.floor(parseFloat(curlst[2]) * 10000),
                volume: parseInt(curlst[3]),
                realmoney: Math.floor(parseFloat(curlst[4]) * 10000),
                panstate: 0
            };

            if (curlst[5] == '买盘') {
                cn.panstate = 1;
            }
            else if (curlst[5] == '卖盘') {
                cn.panstate = -1;
            }

            if (isNaN(cn.priceoff)) {
                cn.priceoff = 0;
            }

            if (isNaN(cn.volume)) {
                cn.volume = 0;
            }

            if (isNaN(cn.realmoney)) {
                cn.realmoney = 0;
            }

            lstjymx.push(cn);
        }

        await StockMgr.singleton.saveJYMX(crawler.options.curyear, crawler.options.code, lstjymx);

        // const lst = csv.parse(str, (err, lst) => {
        //     for (let ii = 0; ii < lst.length; ++ii) {
        //
        //     }
        // });

        // fs.writeFileSync(crawler.options.xlsfilename, crawler.data);
    }
    else {
        console.log(str);
    }

    return crawler;
}

let sinajymx2Options = {
    typename: OPTIONS_TYPENAME,
    // 主地址
    uri: 'http://market.finance.sina.com.cn/downxls.php?date=2017-10-25&symbol=sh600000',
    timeout: 30 * 1000,

    force_encoding: 'binary',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.NULL,

    // 分析数据
    func_analysis: func_analysis
};

async function startJYMX2Crawler(code, beginday, endday) {
    let sd = moment(beginday);
    let ed = moment(endday);

    while (sd.isBefore(ed)) {
        let curday = sd.format('YYYY-MM-DD');

        let op = Object.assign({}, sinajymx2Options);
        op.uri = util.format('http://market.finance.sina.com.cn/downxls.php?date=%s&symbol=%s', curday, code);
        op.code = code.substr(code.length - 6, 6);
        op.curday = curday;
        op.curyear = sd.format('YYYY');
        op.xlsfilename = code + '_' + curday + '.xls';
        // op.uri = util.format('http://quotes.sina.cn/hs/company/quotes/view/%s/?from=wap', code);
        //op.headlesschromename = hcname;
        // op.code = code.substr(code.length - 6, 6);
        await CrawlerMgr.singleton.addCrawler(op);

        sd = sd.add(1, 'days');
    }
}

async function startAllJYMX2Crawler(beginday, endday) {
    for (let code in StockMgr.singleton.mapStock) {
        let fcode = StockMgr.singleton.mapStock[code].bourse.toLowerCase() + code;
        await startJYMX2Crawler(fcode, beginday, endday);
    }
}

// function startAllStockToday2Crawler(hcname) {
//     for (let code in StockMgr.singleton.mapStock) {
//         if (code.charAt(0) == '0' && code.charAt(1) == '9') {
//             continue;
//         }
//
//         if (code.charAt(0) == '1' && code.charAt(1) == '0') {
//             continue;
//         }
//
//         let fcode = StockMgr.singleton.mapStock[code].bourse.toLowerCase() + code;
//         startStockToday2Crawler(fcode, hcname);
//     }
// }

CrawlerMgr.singleton.regOptions(OPTIONS_TYPENAME, () => {
    let options = Object.assign({}, sinajymx2Options);
    return options;
});

exports.startJYMX2Crawler = startJYMX2Crawler;
exports.startAllJYMX2Crawler = startAllJYMX2Crawler;
// exports.startAllStockToday2Crawler = startAllStockToday2Crawler;