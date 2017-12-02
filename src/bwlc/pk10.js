"use strict";

let { CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE } = require('crawlercore');
let { LotteryMgr } = require('./lotterymgr');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');

function analysisNode(crawler, element, lst) {
    let code, opentime;
    let lstret = [];

    cheerio('td', element).each((ni, nele) => {
        let obj = cheerio(nele);
        if (ni == 0) {
            code = obj.text();
        }
        else if (ni == 1) {
            let curstr = obj.text();
            let curlst = curstr.split(',');

            for (let ii = 0; ii < curlst.length; ++ii) {
                lstret.push(parseInt(curlst[ii]));
            }
        }
        else if (ni == 2) {
            opentime = obj.text();
        }

        return true;
    });

    let curnode = {
        code: code,
        opentime: opentime
    };

    for (let ii = 0; ii < lstret.length; ++ii) {
        curnode['result' + ii] = lstret[ii];
    }

    lst.push(curnode);
}

// 分析数据
async function func_analysis(crawler) {
    crawler.da.data('table.tb').each((index, element) => {
        if (index == 0) {
            cheerio('tbody', element).each(async (fi, tele) => {
                if (fi == 0) {
                    let lst = [];

                    cheerio('tr', element).each((ni, nele) => {
                        if (ni > 1) {
                            analysisNode(crawler, nele, lst);
                        }

                        return true;
                    });

                    await LotteryMgr.singleton.savePK10(lst);
                }

                return true;
            });
        }

        return true;
    });

    return crawler;
}

let pk10Options = {
    // 主地址
    uri: 'http://bwlc.net/bulletin/trax.html?page=1',
    timeout: 30 * 1000,

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 分析数据
    func_analysis: func_analysis
};

function addPK10Crawler(page) {
    let curms = moment().format('x');
    let op = Object.assign({}, pk10Options);
    op.uri = util.format("http://bwlc.net/bulletin/trax.html?page=%d", page);
    CrawlerMgr.singleton.addCrawler(op);
}

function addAllPK10Crawler(funcname) {
    for (let page = 1; page <= 14861; page++) {
        addPK10Crawler(page);
    }
}

exports.pk10Options = pk10Options;
exports.addPK10Crawler = addPK10Crawler;
exports.addAllPK10Crawler = addAllPK10Crawler;