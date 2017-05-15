"use strict";

let {CrawlerMgr, CRAWLER, DATAANALYSIS, STORAGE} = require('../index');
let util = require('util');
let fs = require('fs');
let mysql = require('mysql2/promise');

const mysqlcfg = JSON.parse(fs.readFileSync('./mysqlcfg.json').toString());

class RecordMgr {
    constructor() {
        this.conn = undefined;
    }

    async init(mysqlcfg) {
        this.conn = await mysql.createConnection(mysqlcfg);
    }

    async hasGameCode(gamecode) {
        let str = util.format("select id from pokermate where gamecode = '%s';", gamecode);
        let [rows, fields] = await this.conn.query(str);
        if (rows != undefined && rows != null && Array.isArray(rows) && rows.length > 0) {
            return true;
        }

        return false;
    }

    async insGameInfo(gamecode, gameinfo) {
        let str = util.format("insert into pokermate(gamecode, gameinfo) values('%s', '%s');", gamecode, gameinfo);
        await this.conn.query(str);
    }
}

RecordMgr.singleton = new RecordMgr();

// 主页面配置
let replayOptions = {
    // 主地址
    uri: 'http://replay.pokermate.net:8080/handplayer/replay/?url=de6eb0a0ba32c4a9471c69b0d45228688af5cfe4e65ba99787edd6da384cb3affe3777d030db9d76e0aa92658c4784b7',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, sdch',
        'Accept-Language': 'zh,en-US;q=0.8,en;q=0.6',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Cookie': 'JSESSIONID=01313F5DE62FEAF36110FB9C73B8A863',
        'Host': 'replay.pokermate.net:8080',
        'Upgrade-Insecure-Requests': 1
    },

    timeout: 1500,

    // 爬虫类型
    crawler_type: CRAWLER.REQUEST,

    // 数据分析配置
    dataanalysis_type: DATAANALYSIS.CHEERIO,

    // 持久化配置
    storage_type: STORAGE.SQL,
    storage_cfg: {
        filename: 'fund.sql',
        func_procline: ld => {
            return util.format("insert into fundbase(name, code) values('%s', '%s');", ld.name, ld.fundcode);
        }},

    // 分析数据
    func_analysis: async crawler => {
        let gameinfo = undefined;
        let beginstr = "$.parseJSON('";
        let endstr = "');";
        let bi = crawler.data.indexOf(beginstr);
        if (bi >= 0) {
            let nbi = bi + beginstr.length;
            let nstr = crawler.data.substr(nbi);
            let ei = nstr.indexOf(endstr);
            gameinfo = nstr.substr(0, ei);

            console.log(gameinfo);
            //JSON.parse(jsonstr);
        }

        let gamecode = undefined;
        let gibeginstr = '?url=';
        let gibi = crawler.options.uri.indexOf(gibeginstr);
        if (gibi >= 0) {
            let nbi = gibi + gibeginstr.length;
            gamecode = crawler.options.uri.substr(nbi);

            console.log(gamecode);

            if (await !RecordMgr.singleton.hasGameCode(gamecode)) {
                await RecordMgr.singleton.insGameInfo(gamecode, gameinfo);
            }
        }

        let lstgamecode = [];
        crawler.da.data('div.recomm').each((index, element) => {
            gibi = element.attribs.onclick.indexOf(gibeginstr);
            if (gibi >= 0) {
                let nbi = gibi + gibeginstr.length;
                let curgamecode = element.attribs.onclick.substr(nbi, element.attribs.onclick.length - nbi - 1);

                console.log(curgamecode);
                lstgamecode.push(curgamecode);
            }
        });

        for (let ii = 0; ii < lstgamecode.length; ++ii) {
            let curgamecode = lstgamecode[ii];
            let cururi = 'http://replay.pokermate.net:8080/handplayer/replay/?url=' + curgamecode;
            if (!CrawlerMgr.singleton.hasCrawler(cururi)) {
                let isok = await RecordMgr.singleton.hasGameCode(curgamecode);
                if (!isok) {
                    let co = Object.assign({}, replayOptions);
                    co.uri = cururi;
                    CrawlerMgr.singleton.addCrawler(co);
                }
            }
        }


        return crawler;
    }
};

//CrawlerMgr.singleton.startHeapdump(10000);
//CrawlerMgr.singleton.startMemWatch();

CrawlerMgr.singleton.processCrawlerNums = 8;
CrawlerMgr.singleton.processDelayTime = 0.3;
CrawlerMgr.singleton.addCrawler(replayOptions);

RecordMgr.singleton.init(mysqlcfg).then(() => {
    CrawlerMgr.singleton.start(true, true);
});
