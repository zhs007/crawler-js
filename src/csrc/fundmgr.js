"use strict";

class Fund{
    constructor() {
        this.code = '';
        this.name = '';
        this.uri = '';
        this.company = '';
    }
}

class FundMgr{
    constructor() {
        this.mapFund = {};
    }

    addFund(code, name, uri) {
        let f = new Fund();
        f.code = code;
        f.name = name;
        f.uri = uri;

        this.mapFund[code] = f;
    }
}

exports.FundMgr = FundMgr;