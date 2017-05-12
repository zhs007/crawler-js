"use strict";

let {STORAGE} = require('./basedef');
let {Storage} = require('./storage');
let CrawlerMgr = require('./crawlermgr');
let mysql = require('mysql2/promise');

class Storage_mysql extends Storage {

    constructor(crawler) {
        super(crawler);
    }

    async onSave() {
        if (this.data.length > 0) {
            let conn = await mysql.createConnection(this.crawler.options.storage_cfg.mysqlcfg);
            for (let ii = 0; ii < this.data.length; ++ii) {
                await conn.query(this.crawler.options.storage_cfg.func_procline(this.data[ii]));
            }

            conn.end();
        }

        return this.crawler;
    }
};

CrawlerMgr.singleton.regStorage(STORAGE.MYSQL, function (crawler) {
    return new Storage_mysql(crawler);
});

exports.Storage_mysql = Storage_mysql;