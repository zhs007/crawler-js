"use strict";

let {STORAGE} = require('./basedef');
let {Storage} = require('./storage');
let CrawlerMgr = require('./crawlermgr');
let fs = require('fs');

class Storage_csv extends Storage {

    constructor(crawler) {
        super(crawler);
    }

    async onSave() {
        if (this.data.length > 0) {
            let fd = fs.openSync(this.crawler.options.storage_cfg.filename, 'w');

            let d0 = this.data[0];
            if (typeof d0 == 'object') {    // is a object arr
                let headarr = [];
                let strhead = '';
                for (let key in d0) {
                    headarr.push(key);

                    if (strhead.length > 0) {
                        strhead += ',';
                        strhead += key;
                    }
                    else {
                        strhead += key;
                    }
                }

                fs.writeSync(fd, strhead + '\r\n');

                // save all data
                for (let ii = 0; ii < this.data.length; ++ii) {
                    let curd = this.data[ii];
                    let strline = '';
                    for (let jj = 0; jj < headarr.length; ++jj) {
                        if (jj > 0) {
                            strline += ',';
                            strline += curd[headarr[jj]];
                        }
                        else {
                            strline += curd[headarr[jj]];
                        }
                    }

                    fs.writeSync(fd, strline + '\r\n');
                }
            }
            else {
                for (let ii = 0; ii < this.data.length; ++ii) {
                    fs.writeSync(fd, this.data[ii] + '\r\n');
                }
            }

            fs.closeSync(fd);
        }

        return this.crawler;
    }
};

CrawlerMgr.singleton.regStorage(STORAGE.CSV, function (crawler) {
    return new Storage_csv(crawler);
});

exports.Storage_csv = Storage_csv;