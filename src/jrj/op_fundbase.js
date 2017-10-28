"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let { FundState, FundMgr } = require('./fundmgr');
let { START_YEAR, END_YEAR, MODE_INITFUNDBASE, MODE_INITFUNDARCH, MODE_UPDFUNDARCH } = require('./basedef');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');

async function func_analysis(crawler) {
    let mh_title = crawler.da.data('h1.mh-title').text();
    let titlearr0 = mh_title.split('（');
    let titlearr1 = titlearr0[1].split('）');
    let title = titlearr0[0];
    let code = titlearr1[0];

    let fsarr = [];
    crawler.da.data('i.zt').each((index, element) => {
        if (element.children.length > 0 && element.children[0].children.length > 0) {
            fsarr.push(element.children[0].children[0].data);
        }
        else {
            fsarr.push('');
        }
    });

    if (fsarr.length == 2) {
        fsarr.splice(0, 0, '');
    }

    for (let ii = 0; ii < fsarr.length; ++ii) {
        FundState.singleton.addState(fsarr[ii]);
    }

    FundMgr.singleton.map[code].name = title;
    FundMgr.singleton.map[code].fsarr = fsarr;

    return crawler;
}

// fund主页面配置
let fundbaseOptions = {
    // 主地址
    uri: '',
    timeout: 1500,
    force_encoding: 'gbk',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 分析数据
    func_analysis: func_analysis
};

function addFundBase(uri) {
    let op = Object.assign({}, fundbaseOptions);
    op.uri = uri;
    CrawlerMgr.singleton.addCrawler(op);
}

exports.addFundBase = addFundBase;