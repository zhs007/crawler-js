"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../../index');
let cheerio = require('cheerio');

function analysisCompany(element) {
    cheerio(element).children('span.fundtitle').each((ci, cele) => {
        let obj = cheerio(cele).children('a');
        let href = obj.attr('href');
        let text = obj.text();
        let cname = '';
        let code = '';
        let iskh = false;

        for (let i = 0; i < text.length; ++i) {
            let cc = text.charAt(i);
            if (cc == '\n' || cc == ' ') {
                continue;
            }

            if (cc == '（') {
                iskh = true;
                continue;
            }

            if (cc == '）') {
                break;
            }

            if (iskh) {
                if (cc >= '0' && cc <= '9') {
                    code += cc;
                }
            }
            else {
                cname += cc;
            }
        }

        console.log('CompanyOptions ' + cname + ' ' + code + ' ' + href);
    });
}

function analysisFund(element) {
    cheerio(element).children('ul.zzbb').each((ni, nele) => {
        cheerio(nele).children('li').each((ci, cele) => {
            let obj = cheerio(cele).children('a');
            let href = obj.attr('href');
            let text = obj.text();
            let cname = '';
            let code = '';
            let iskh = false;

            for (let i = 0; i < text.length; ++i) {
                let cc = text.charAt(i);
                if (cc == '\n' || cc == ' ') {
                    continue;
                }

                if (cc == '（') {
                    iskh = true;
                    continue;
                }

                if (cc == '）') {
                    break;
                }

                if (iskh) {
                    if (cc >= '0' && cc <= '9') {
                        code += cc;
                    }
                }
                else {
                    cname += cc;
                }
            }

            console.log('CompanyOptions ' + cname + ' ' + code + ' ' + href);
        });
    });
}

let CompanyOptions = {
    // 主地址
    uri: [
        'http://fund.csrc.gov.cn/web/fund_compay_affiche.fund_affiche?type=4040-1010',
        'http://fund.csrc.gov.cn/web/fund_compay_affiche.fund_affiche?type=4040-1030',
        'http://fund.csrc.gov.cn/web/fund_compay_affiche.fund_affiche?type=4040-1070',
        'http://fund.csrc.gov.cn/web/fund_compay_affiche.fund_affiche?type=4040-1050'
    ],
    timeout: 15000,

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 分析数据
    func_analysis: async crawler => {
        crawler.da.data('ul#fundCompany').each((index, element) => {
            cheerio(element).children('li').each((ni, nele) => {
                analysisCompany(nele);
                analysisFund(nele);

                return true;
            });

            return true;
        });

        return crawler;
    }
};

exports.CompanyOptions = CompanyOptions;