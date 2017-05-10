"use strict";

// var iconv = require('iconv-lite');

class Crawler {

    constructor(options) {
        this.options = options;
        this.data = undefined;
        this.da = undefined;
    }

    async start() {
        return this;
    }

    onProcess(data) {
        this.data = data;
        // this.data = iconv.decode(new Buffer(data), 'gbk');
        // console.log(this.data);
    }

    onError(err) {
    }
};

exports.Crawler = Crawler;