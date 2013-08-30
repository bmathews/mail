var ewsApi = require('./protocol/ews/api'),
    levelup = require('levelup');

var accounts, db;

function loadDb(callback) {
    leveldb = levelup('./accountsdb');
    leveldb.put('atsid', {
        url: 'owa.atsid.com',
        username: 'brian.mathews',
        password: ''
    }, {
        valueEncoding : 'json'
    }, function (err) {
        if (err) { throw err; }
        callback(leveldb);
    });
}

function loadAccounts(callback) {
    db.get('atsid', {
        valueEncoding : 'json'
    }, function (err, account) {
        if (err) { throw err; }
        ewsApi.initialize(account, function (api) {
            callback({
                'atsid': api
            });
        });
    });
}

module.exports.initialize = function (callback) {
    if (!accounts) {
        loadDb(function (loadedDb) {
            db = loadedDb;

            loadAccounts(function (loadedAccounts) {
                accounts = loadedAccounts;
                callback(accounts);
            });
        });
    } else {
        callback(accounts);
    }
};

module.exports.getAccounts = function () {
    return accounts;
};