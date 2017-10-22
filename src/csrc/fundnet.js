"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../../index');
let {addFundCrawler} = require('./fund');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');

function analysisNode(crawler, element) {
    let code = '';
    let name = '';
    let uri = '';
    let net = undefined;
    let totalnet = undefined;

    cheerio('td', element).each((ci, cele) => {
        let obj = cheerio(cele);
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
    });

    let curfund = {
        code: code,
        name: name,
        uri: uri,
        net: net,
        totalnet: totalnet
    };

    if (crawler.options.fundmap.hasOwnProperty(code)) {
        let lastfund = crawler.options.fundmap[code];
        if (lastfund.net == undefined && lastfund.totalnet == undefined) {
            crawler.options.fundmap[code] = curfund;
        }
        else {
            console.log(util.format('error %s %s %s %s %s', code, name, uri, net, totalnet));

            return ;
        }
    }
    else {
        crawler.options.fundmap[code] = curfund;
    }

    console.log(util.format('fundnet %s %s %s %s %s', code, name, uri, net, totalnet));
    addFundCrawler('http://fund.csrc.gov.cn' + uri);

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
        let op = Object.assign({}, baseop);
        op.curday = sd.format('YYYY-MM-DD');
        op.uri = util.format('http://fund.csrc.gov.cn/web/open_fund_daily_net.daily_report?fundType=6020-6010&netDate=%s', op.curday);
        op.fundmap = {};
        CrawlerMgr.singleton.addCrawler(op);
        sd = sd.add(1, 'days');
    }
}

exports.fundnetOptions = fundnetOptions;
exports.addFundNetCrawler = addFundNetCrawler;