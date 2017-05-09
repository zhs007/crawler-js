"use strict";

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
    }

    onError(err) {
    }
};

exports.Crawler = Crawler;