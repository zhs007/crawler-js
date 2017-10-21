"use strict";

class Fund{
    constructor() {
        this.code = '';
        this.name = '';
        this.uri = '';
        this.companycode = '';
    }
}

class FundCompany{
    constructor() {
        this.code = '';
        this.name = '';
        this.uri = '';

        this.mapFund = {};
    }

    addFund(fund) {
        this.mapFund[fund.code] = fund;
    }
}

class FundMgr{
    constructor() {
        this.mapCompany = {};
        this.mapFund = {};
    }

    addCompany(code, name, uri) {
        let c = new FundCompany();
        c.code = code;
        c.name = name;
        c.uri = uri;

        this.mapCompany[code] = c;
    }

    addFund(companycode, code, name, uri) {
        let f = new Fund();
        f.code = code;
        f.name = name;
        f.uri = uri;
        f.companycode = companycode;

        this.mapFund[code] = f;
        this.mapCompany[companycode].addFund(f);
    }
}

exports.FundMgr = FundMgr;