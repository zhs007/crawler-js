"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('crawlercore');
let { FundMgr } = require('./fundmgr');
let { addFundArch } = require('./op_fundarch');
let { addFundBase } = require('./op_fundbase');
let { START_YEAR, END_YEAR, MODE_INITFUNDBASE, MODE_INITFUNDARCH, MODE_UPDFUNDARCH } = require('./basedef');
let cheerio = require('cheerio');
let moment = require('moment');
let util = require('util');

async function func_analysis(crawler) {
    crawler.da.data('[href]').each((index, element) => {
        if (element.name == 'a' && element.attribs.href.indexOf('http://fund.jrj.com.cn/archives,') == 0) {
            //console.log(element.attribs.href);
            //console.log(element.attribs.title);

            let str0 = element.attribs.href.split(',');
            let fundcode = str0[1].split('.')[0];

            FundMgr.singleton.addFund({
                name: element.attribs.title,
                url: element.attribs.href,
                fundcode: fundcode,
                fsarr: [],
                lstval: {}
            });

            if (crawler.options.CURMODE == MODE_INITFUNDBASE) {
                addFundBase(element.attribs.href);
            }
            else if (crawler.options.CURMODE == MODE_UPDFUNDARCH) {
                let curyear = moment().format('YYYY');
                let curday = moment().format('YYYY-MM-DD');
                let lastday = moment(curday).subtract(15, 'days').format('YYYY-MM-DD');
                let lastyear = moment(lastday).format('YYYY');

                if (lastyear != curyear) {
                    addFundArch(fundcode, lastyear, lastday, curday);
                }

                addFundArch(fundcode, curyear, lastday, curday);
            }
            else {
                for (let year = START_YEAR; year <= END_YEAR; ++year) {
                    addFundArch(fundcode, year, '', '');
                }
            }

            // return false;
            //crawler.storage.pushData({name: element.attribs.title, url: element.attribs.href, fundcode: fundcode});
        }

        return true;
    });

    return crawler;
}

// 主页面配置
let totalfundOptions = {
    // 主地址
    uri: 'http://fund.jrj.com.cn/family.shtml',
    timeout: 1500,
    force_encoding: 'gbk',

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 分析数据
    func_analysis: func_analysis,

    CURMODE: MODE_UPDFUNDARCH,
};

function addTotalFund(mode) {
    let op = Object.assign({}, totalfundOptions);
    op.CURMODE = mode;
    CrawlerMgr.singleton.addCrawler(op);
}

exports.addTotalFund = addTotalFund;