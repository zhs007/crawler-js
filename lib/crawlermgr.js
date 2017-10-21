"use strict";

let {CRAWLER, DATAANALYSIS, STORAGE} = require('./basedef');
let heapdump = require('heapdump');
let memwatch = require('memwatch-next');
let process = require('process');
let moment = require('moment');

class CrawlerMgr {

    constructor() {
        this.mapCrawler = {};
        this.mapDA = {};
        this.mapStorage = {};

        this.lstCrawler = [];
        this.lstCrawlerRuning = [];
        this.processCrawlerNums = 1;    // 同时处理的任务数量
        this.processDelayTime = 30;     // 每个任务处理间隔时间，秒

        this.timerOnIdle = undefined;

        this.autoStop = false;          // 是否自动stop，队列为空就stop
        this.autoExitOnStop = false;    // stop时是否自动退出

        this.funcOnStop = undefined;
        this.isAsync_funcOnStop = false;
    }

    // funcNew(options)
    regCrawler(crawlertype, funcNew) {
        this.mapCrawler[crawlertype] = funcNew;
    }

    // funcNew(crawler)
    regDataAnalysis(datype, funcNew) {
        this.mapDA[datype] = funcNew;
    }

    // funcNew(crawler)
    regStorage(storagetype, funcNew) {
        this.mapStorage[storagetype] = funcNew;
    }

    // _delay(delay) {
    //     return new Promise((resolve) => {
    //         setTimeout(resolve, delay * 1000);
    //     });
    // }

    // _onAddCrawler() {
    //     if (this.lstCrawler.length <= 0) {
    //         return ;
    //     }
    //
    //     let crawler = this.lstCrawler[0];
    //     if (this.lstCrawlerRuning.length < this.processCrawlerNums) {
    //         this.lstCrawler.splice(0, 1);
    //
    //         this._startCrawler(crawler);
    //     }
    // }

    // async _onEndCrawler(crawler) {
    //     let ci = this.lstCrawlerRuning.indexOf(crawler);
    //     if (ci >= 0) {
    //         this.lstCrawlerRuning.splice(ci, 1);
    //     }
    //
    //     crawler = undefined;
    //
    //     if (this.lstCrawler.length > 0) {
    //         let ncrawler = this.lstCrawler[0];
    //         this.lstCrawler.splice(0, 1);
    //
    //         await this._startCrawler(ncrawler);
    //
    //         return ;
    //     }
    //
    //     return ;
    // }

    async _startCrawler(crawler) {
        this.lstCrawlerRuning.push(crawler);

        console.log('start crawler ' + crawler.options.uri + ' - ' + moment().format('YYYY-MM-DD HH:mm:ss'));
        console.log('last crawler nums is ' + this.lstCrawler.length);

        await crawler.start().then(async crawler => {
            if (crawler != undefined) {
                if (crawler.options.dataanalysis_type != DATAANALYSIS.NULL) {
                    let da = this.mapDA[crawler.options.dataanalysis_type](crawler);
                    da.onAnalysis();
                }

                if (crawler.options.func_analysis != undefined) {
                    await crawler.options.func_analysis(crawler);
                }
            }

            return ;
        });

        console.log('end crawler ' + crawler.options.uri);

        let ci = this.lstCrawlerRuning.indexOf(crawler);
        if (ci >= 0) {
            this.lstCrawlerRuning.splice(ci, 1);
        }

        crawler = undefined;

        // await this._delay(this.processDelayTime);
        // crawler = await this._onEndCrawler(crawler);
        //
        return ;
    }

    _addCrawler_UriArr(options) {
        if (Array.isArray(options.uri)) {
            for (let i = 0; i < options.uri.length; ++i) {
                let op = Object.assign({}, options);
                op.uri = options.uri[i];
                this.addCrawler(op);
            }
        }
    }

    // start Crawler
    addCrawler(options) {
        if (Array.isArray(options.uri)) {
            this._addCrawler_UriArr(options);

            return ;
        }

        let crawlertype = CRAWLER.REQUEST;
        let datype = DATAANALYSIS.NULL;
        let storagetype = STORAGE.NULL;

        if (options.hasOwnProperty('crawler_type')) {
            crawlertype = options.crawler_type;
        }
        else {
            options.crawler_type = crawlertype;
        }

        if (options.hasOwnProperty('dataanalysis_type')) {
            datype = options.dataanalysis_type;
        }
        else {
            options.dataanalysis_type = datype;
        }

        if (options.hasOwnProperty('storage_type')) {
            storagetype = options.storage_type;
        }
        else {
            options.storage_type = storagetype;
        }

        let crawler = this.mapCrawler[crawlertype](options);
        let storage = this.mapStorage[storagetype](crawler);

        this.lstCrawler.push(crawler);

        //this._onAddCrawler();

        return ;
    }

    _onIdle() {
        if (this.lstCrawler.length <= 0) {
            if (this.autoStop) {
                if (this.lstCrawlerRuning.length <= 0) {
                    this.stop();
                }
            }

            return ;
        }

        let crawler = this.lstCrawler[0];
        if (this.lstCrawlerRuning.length < this.processCrawlerNums) {
            this.lstCrawler.splice(0, 1);

            this._startCrawler(crawler);
        }

        return ;
    }

    start(autoStop, autoExitOnStop, funcOnStop, isAsync_funcOnStop) {
        if (isAsync_funcOnStop == undefined) {
            isAsync_funcOnStop = false;
        }

        this.stop();

        this.autoStop = autoStop;
        this.autoExitOnStop = autoExitOnStop;
        this.funcOnStop = funcOnStop;
        this.isAsync_funcOnStop = isAsync_funcOnStop;

        this.timerOnIdle = setInterval(() => {
            this._onIdle();
        }, this.processDelayTime * 1000);
    }

    stop() {
        if (this.timerOnIdle != undefined) {
            clearInterval(this.timerOnIdle);

            this.timerOnIdle = undefined;

            if (this.funcOnStop != undefined) {
                if (this.isAsync_funcOnStop) {
                    this.funcOnStop().then(() => {
                        if (this.autoExitOnStop) {
                            process.exit(0);
                        }
                    });
                }
                else {
                    this.funcOnStop();

                    if (this.autoExitOnStop) {
                        process.exit(0);
                    }
                }
            }
            else {
                if (this.autoExitOnStop) {
                    process.exit(0);
                }
            }
        }
    }

    hasCrawler(uri) {
        for (let ii = 0; ii < this.lstCrawlerRuning.length; ++ii) {
            if (uri == this.lstCrawlerRuning[ii].options.uri) {
                return true;
            }
        }

        for (let ii = 0; ii < this.lstCrawler.length; ++ii) {
            if (uri == this.lstCrawler[ii].options.uri) {
                return true;
            }
        }

        return false;
    }

    startHeapdump(timeOff) {
        setInterval(() => {
            heapdump.writeSnapshot('./' + Date.now() + '.heapsnapshot');
        }, timeOff);
    }

    startMemWatch() {
        memwatch.on('leak', info => {
            console.log(info);

            let hd = new memwatch.HeapDiff();
            let diff = hd.end();

            console.log(diff);
        });

        memwatch.on('stats', stats => {
            console.log(stats);
        });
    }
};

exports.singleton = new CrawlerMgr();