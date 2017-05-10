"use strict";

const CRAWLER = {
    REQUEST: 'request',
    HEADLESSCHROME: 'headlesschrome',
};

const DATAANALYSIS = {
    NULL: 'null',
    CHEERIO: 'cheerio',
};

const STORAGE = {
    NULL: 'null',
    MYSQL: 'mysql',
    CSV: 'csv',
    EXCEL: 'excel',
    SQL: 'sql',
    JSON: 'json',
};

exports.CRAWLER         = CRAWLER;
exports.DATAANALYSIS    = DATAANALYSIS;
exports.STORAGE         = STORAGE;