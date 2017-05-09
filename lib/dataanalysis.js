"use strict";

class DataAnalysis {

    constructor(crawler) {
        this.crawler = crawler;
        this.data = undefined;

        crawler.da = this;
    }

    onAnalysis() {

    }
};

exports.DataAnalysis = DataAnalysis;