"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../../index');
let {addFundCrawler} = require('./fund');
let {FundMgr} = require('./fundmgr');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');

function analysisNode(crawler, element) {
    let code = '';
    let name = '';
    let uri = '';
    let net = undefined;
    let totalnet = undefined;
    let hundred = undefined;
    let tenthousand = undefined;
    let million = undefined;
    let annualizedrate = undefined;

    cheerio('td', element).each((ci, cele) => {
        let obj = cheerio(cele);
        if (crawler.options.mode2) {
            if (ci == 1) {
                code = obj.text();
            }
            else if (ci == 2) {
                let obj = cheerio(cele).children('a');
                uri = obj.attr('href');
                name = obj.text().trim();
            }
            else if (ci == 3) {
                let ct = obj.text();
                if (ct != '') {
                    hundred = Math.floor(parseFloat(ct) * 10000);
                }
            }
            else if (ci == 4) {
                let ct = obj.text();
                if (ct != '') {
                    tenthousand = Math.floor(parseFloat(ct) * 10000);
                }
            }
            else if (ci == 5) {
                let ct = obj.text();
                if (ct != '') {
                    million = Math.floor(parseFloat(ct) * 10000);
                }
            }
            else if (ci == 6) {
                let ct = obj.text();
                if (ct != '') {
                    let arrct = ct.split('%');
                    annualizedrate = Math.floor(parseFloat(arrct[0]) * 10000);
                }
            }
            else if (ci == 7) {
                let ct = obj.text();
                if (ct != '') {
                    net = Math.floor(parseFloat(ct) * 10000);
                }
            }
            else if (ci == 8) {
                let ct = obj.text();
                if (ct != '') {
                    totalnet = Math.floor(parseFloat(ct) * 10000);
                }
            }
        }
        else {
            if (ci == 1) {
                code = obj.text();
            }
            else if (ci == 2) {
                let obj = cheerio(cele).children('a');
                uri = obj.attr('href');
                name = obj.text().trim();
            }
            else if (ci == 3) {
                let ct = obj.text();
                if (ct != '') {
                    net = Math.floor(parseFloat(ct) * 10000);
                }
            }
            else if (ci == 4) {
                let ct = obj.text();
                if (ct != '') {
                    totalnet = Math.floor(parseFloat(ct) * 10000);
                }
            }
        }
    });

    let curfund = {
        code: code,
        name: name,
        uri: 'http://fund.csrc.gov.cn' + uri,
        net: net,
        totalnet: totalnet,
        hundred: hundred,
        tenthousand: tenthousand,
        million: million,
        annualizedrate: annualizedrate
    };

    // if (crawler.options.fundmap.hasOwnProperty(code)) {
    //     let lastfund = crawler.options.fundmap[code];
    //     if (lastfund.net == undefined && lastfund.totalnet == undefined) {
    //         crawler.options.fundmap[code] = curfund;
    //     }
    //     else {
    //         console.log(util.format('error %s %s %s %s %s', code, name, uri, net, totalnet));
    //
    //         return ;
    //     }
    // }
    // else {
    //     crawler.options.fundmap[code] = curfund;
    // }

    crawler.options.fundmap[code] = curfund;

    console.log(util.format('fundnet %s %s %s %s %s', code, name, uri, net, totalnet));

    // if (!FundMgr.singleton.isAlreadyInDB(code)) {
    //     addFundCrawler(curfund);
    // }

    return ;
}

// 分析数据
async function func_analysis(crawler) {
    crawler.da.data('#tablesorter-instance').each((index, element) => {
        cheerio('tbody', element).each((fi, tele) => {
            cheerio('tr', tele).each((ni, nele) => {
                analysisNode(crawler, nele);

                return true;
            });

            return true;
        });

        return true;
    });

    for (let code in crawler.options.fundmap) {
        let curfund = crawler.options.fundmap[code];
        if (FundMgr.singleton.isNeedIn(code)) {
            addFundCrawler(curfund);
        }
    }

    await FundMgr.singleton.saveFundNet(crawler.options.fundmap, crawler.options.curday);

    return crawler;
}

let fundnetOptions = {
    // 主地址
    uri: [
        'http://fund.csrc.gov.cn/web/open_fund_daily_net.daily_report?fundType=6020-6010&netDate=2017-10-21',
    ],
    timeout: 15000,

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 分析数据
    func_analysis: func_analysis
};

function addFundNetCrawler(startday, endday, baseop) {
    let sd = moment(startday);
    let ed = moment(endday);

    while (sd.isBefore(ed)) {
        // 股票型
        {
            let op = Object.assign({}, baseop);
            op.curday = sd.format('YYYY-MM-DD');
            op.uri = util.format('http://fund.csrc.gov.cn/web/open_fund_daily_net.daily_report?fundType=6020-6010&netDate=%s', op.curday);
            op.fundmap = {};
            op.mode2 = false;
            CrawlerMgr.singleton.addCrawler(op);
        }

        // 混合型
        {
            let op = Object.assign({}, baseop);
            op.curday = sd.format('YYYY-MM-DD');
            op.uri = util.format('http://fund.csrc.gov.cn/web/open_fund_daily_net.daily_report?fundType=6020-6040&netDate=%s', op.curday);
            op.fundmap = {};
            op.mode2 = false;
            CrawlerMgr.singleton.addCrawler(op);
        }

        // 债券型
        {
            let op = Object.assign({}, baseop);
            op.curday = sd.format('YYYY-MM-DD');
            op.uri = util.format('http://fund.csrc.gov.cn/web/open_fund_daily_net.daily_report?fundType=6020-6030&netDate=%s', op.curday);
            op.fundmap = {};
            op.mode2 = false;
            CrawlerMgr.singleton.addCrawler(op);
        }

        // QDII
        {
            let op = Object.assign({}, baseop);
            op.curday = sd.format('YYYY-MM-DD');
            op.uri = util.format('http://fund.csrc.gov.cn/web/open_fund_daily_net.daily_report?fundType=6020-6050&netDate=%s', op.curday);
            op.fundmap = {};
            op.mode2 = false;
            CrawlerMgr.singleton.addCrawler(op);
        }

        // 封闭式
        {
            let op = Object.assign({}, baseop);
            op.curday = sd.format('YYYY-MM-DD');
            op.uri = util.format('http://fund.csrc.gov.cn/web/open_fund_daily_net.daily_report?fundType=6030-1010&netDate=%s', op.curday);
            op.fundmap = {};
            op.mode2 = false;
            CrawlerMgr.singleton.addCrawler(op);
        }

        // 货币型
        {
            let op = Object.assign({}, baseop);
            op.curday = sd.format('YYYY-MM-DD');
            op.uri = util.format('http://fund.csrc.gov.cn/web/open_fund_daily_net.daily_report?fundType=6020-6020&netDate=%s', op.curday);
            op.fundmap = {};
            op.mode2 = true;
            CrawlerMgr.singleton.addCrawler(op);
        }

        // 短期理财债券型
        {
            let op = Object.assign({}, baseop);
            op.curday = sd.format('YYYY-MM-DD');
            op.uri = util.format('http://fund.csrc.gov.cn/web/open_fund_daily_net.daily_report?fundType=6020-6060&netDate=%s', op.curday);
            op.fundmap = {};
            op.mode2 = true;
            CrawlerMgr.singleton.addCrawler(op);
        }

        sd = sd.add(1, 'days');
    }
}

exports.fundnetOptions = fundnetOptions;
exports.addFundNetCrawler = addFundNetCrawler;