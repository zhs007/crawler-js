"use strict";

let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE, CRAWLERCACHE, getVal_CDPCallFrame, HeadlessChromeMgr, getDocumentHtml_CDP } = require('crawlercore');
let util = require('util');
let fs = require('fs');
let moment = require('moment');
const iconv = require('iconv-lite');
let { StockMgr } = require('./stockmgr');
let cheerio = require('cheerio');

const OPTIONS_TYPENAME = 'sina_stockpriceday';

const NUMBERSTR = '0123456789-.';

function fixNumber(str) {
    let cstr = '';
    for (let i = 0; i < str.length; ++i) {
        if (NUMBERSTR.indexOf(str.charAt(i)) >= 0) {
            cstr += str.charAt(i);
        }
    }

    return cstr;
}

function analysisNode(crawler, element, lst) {
    let timed, openprice, maxprice, closeprice, minprice, volume, volume2;
    cheerio('td', element).each((ni, nele) => {
        let obj = cheerio(nele);
        if (ni == 0) {
            timed = fixNumber(obj.text());
        }
        else if (ni == 1) {
            openprice = fixNumber(obj.text());
        }
        else if (ni == 2) {
            maxprice = fixNumber(obj.text());
        }
        else if (ni == 3) {
            closeprice = fixNumber(obj.text());
        }
        else if (ni == 4) {
            minprice = fixNumber(obj.text());
        }
        else if (ni == 5) {
            volume = fixNumber(obj.text());
        }
        else if (ni == 6) {
            volume2 = fixNumber(obj.text());
        }

        return true;
    });

    lst.push({
        code: crawler.options.code,
        timed: timed,
        openprice: Math.floor(openprice * 10000),
        maxprice: Math.floor(maxprice * 10000),
        closeprice: Math.floor(closeprice * 10000),
        minprice: Math.floor(minprice * 10000),
        volume: volume,
        volume2: volume2,
    });
}

// 分析数据
async function func_analysis(crawler) {
    let lst = [];
    // let str = await getDocumentHtml_CDP(crawler.options.uri, crawler.client);

    crawler.da.data('table#FundHoldSharesTable').each((index, element) => {
        if (index == 0) {
            cheerio('tbody', element).each((fi, tele) => {
                if (fi == 0) {
                    cheerio('tr', element).each((ni, nele) => {
                        if (ni > 1) {
                            analysisNode(crawler, nele, lst);
                        }

                        return true;
                    });
                }

                return true;
            });
        }

        return true;
    });

    await StockMgr.singleton.saveStockPriceD(crawler.options.code, lst);

    return crawler;
}

let sinapricedayOptions = {
    typename: OPTIONS_TYPENAME,
    // 主地址
    uri: 'http://vip.stock.finance.sina.com.cn/corp/go.php/vMS_MarketHistory/stockid/600030.phtml?year=2003&jidu=1',
    timeout: 30 * 1000,

    force_encoding: 'gbk',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 分析数据
    func_analysis: func_analysis,

    headlesschromename: '',
};

async function startStockPriceDayCrawler(code, beginday, endday) {
    let sd = moment(beginday);
    let ed = moment(endday);
    let sy = sd.format('YYYY');
    let ey = ed.format('YYYY');
    let sq = sd.format('Q');
    let eq = ed.format('Q');

    for (let cy = sy; cy <= ey; ++cy) {
        let ceq = 4;
        if (cy == ey) {
            ceq = eq;
        }

        for (let cq = sq; cq <= ceq; ++cq) {
            let op = Object.assign({}, sinapricedayOptions);
            op.code = code;
            // op.headlesschromename = hcname;
            op.uri = util.format('http://vip.stock.finance.sina.com.cn/corp/go.php/vMS_MarketHistory/stockid/%s.phtml?year=%d&jidu=%d', code, cy, cq);
            await CrawlerMgr.singleton.addCrawler(op);
        }

        sq = 1;
    }
}

async function startAllStockPriceDayCrawler(beginday, endday) {
    for (let code in StockMgr.singleton.mapStock) {
        // let fcode = StockMgr.singleton.mapStock[code].bourse.toLowerCase() + code;
        startStockPriceDayCrawler(code, beginday, endday);
    }
}

CrawlerMgr.singleton.regOptions(OPTIONS_TYPENAME, () => {
    let options = Object.assign({}, sinapricedayOptions);
    return options;
});

exports.startStockPriceDayCrawler = startStockPriceDayCrawler;
exports.startAllStockPriceDayCrawler = startAllStockPriceDayCrawler;
// exports.startAllStockToday2Crawler = startAllStockToday2Crawler;