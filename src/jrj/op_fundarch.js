"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let { FundMgr } = require('./fundmgr');
let { START_YEAR, END_YEAR, MODE_INITFUNDBASE, MODE_INITFUNDARCH, MODE_UPDFUNDARCH } = require('./basedef');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');

async function func_analysis(crawler) {
    let fundinfo = FundMgr.singleton.map[crawler.options.fundcode];

    let jsonstr = crawler.data.substr(8);
    let obj = JSON.parse(jsonstr);

    if (obj.hasOwnProperty('fundHistoryNetValue') && Array.isArray(obj.fundHistoryNetValue)) {
        for (let ii = 0 ; ii < obj.fundHistoryNetValue.length; ++ii) {
            let curfdnv = obj.fundHistoryNetValue[ii];

            fundinfo.lstval[curfdnv.enddate] = {
                enddate: curfdnv.enddate,
                accum_net: Math.floor(parseFloat(curfdnv.accum_net) * 10000),
                unit_net: Math.floor(parseFloat(curfdnv.unit_net) * 10000),
                unit_net_chng_1: Math.floor(parseFloat(curfdnv.unit_net_chng_1) * 10000),
                unit_net_chng_pct: Math.floor(parseFloat(curfdnv.unit_net_chng_pct) * 10000),
                unit_net_chng_pct_1_mon: Math.floor(parseFloat(curfdnv.unit_net_chng_pct_1_mon) * 10000),
                unit_net_chng_pct_1_week: Math.floor(parseFloat(curfdnv.unit_net_chng_pct_1_week) * 10000),
                unit_net_chng_pct_1_year: Math.floor(parseFloat(curfdnv.unit_net_chng_pct_1_year) * 10000),
                unit_net_chng_pct_3_mon: Math.floor(parseFloat(curfdnv.unit_net_chng_pct_3_mon) * 10000),
                guess_net: 0
            };

            if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net)) {
                fundinfo.lstval[curfdnv.enddate].unit_net = 0;
            }

            if (isNaN(fundinfo.lstval[curfdnv.enddate].accum_net)) {
                fundinfo.lstval[curfdnv.enddate].accum_net = 0;
            }

            if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_1)) {
                fundinfo.lstval[curfdnv.enddate].unit_net_chng_1 = 0;
            }

            if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct)) {
                fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct = 0;
            }

            if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_mon)) {
                fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_mon = 0;
            }

            if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_week)) {
                fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_week = 0;
            }

            if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_year)) {
                fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_1_year = 0;
            }

            if (isNaN(fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_3_mon)) {
                fundinfo.lstval[curfdnv.enddate].unit_net_chng_pct_3_mon = 0;
            }
        }

        if (crawler.options.startday == crawler.options.endday) {
            if (crawler.options.year == END_YEAR) {
                for (let iy = START_YEAR; iy <= END_YEAR; ++iy) {
                    await FundMgr.singleton.saveFundArch(crawler.options.fundcode, fundinfo.lstval, iy);
                }
            }
        }
        else {
            await FundMgr.singleton.saveFundArchEx(crawler.options.fundcode, fundinfo.lstval, crawler.options.year, crawler.options.startday, crawler.options.endday);
        }
    }

    return crawler;
}

// fund净值页面配置
let fundarchOptions = {
    fundcode: '000975',
    year: 2016,

    startday: '',
    endday: '',

    // 主地址
    uri: 'http://fund.jrj.com.cn/json/archives/history/netvalue?fundCode=000975&obj=obj&date=2016',
    timeout: 1500,
    force_encoding: 'gbk',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.NULL,

    // 分析数据
    func_analysis: func_analysis
};

function addFundArch(fundcode, year, startday, endday) {
    let co = Object.assign({}, fundarchOptions);
    co.fundcode = fundcode;
    co.year = year;
    co.startday = startday;
    co.endday = endday;
    co.uri = util.format('http://fund.jrj.com.cn/json/archives/history/netvalue?fundCode=%s&obj=obj&date=%d', fundcode, year);
    CrawlerMgr.singleton.addCrawler(co);
}

exports.addFundArch = addFundArch;