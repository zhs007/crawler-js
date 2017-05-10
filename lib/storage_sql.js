"use strict";

let {STORAGE} = require('./basedef');
let {Storage} = require('./storage');
let CrawlerMgr = require('./crawlermgr');
let fs = require('fs');

class Storage_sql extends Storage {

    constructor(crawler) {
        super(crawler);
    }

    async onSave() {
        if (this.data.length > 0) {
            let fd = fs.openSync(this.crawler.options.storage_cfg.filename, 'w');

            for (let ii = 0; ii < this.data.length; ++ii) {
                fs.writeSync(fd, this.crawler.options.storage_cfg.func_procline(this.data[ii]) + '\r\n');
            }

            fs.closeSync(fd);
        }

        return this.crawler;
    }
};

CrawlerMgr.singleton.regStorage(STORAGE.SQL, function (crawler) {
    return new Storage_sql(crawler);
});

exports.Storage_sql = Storage_sql;