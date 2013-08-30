var ewsApi = require('./protocol/ews/api'),
    levelup = require('levelup');

var accounts, db;

function loadDb(callback) {
    leveldb = levelup('./accountsdb');
    leveldb.put('atsid', {
        type: 'Exchange',
        url: 'owa.atsid.com',
        username: 'brian.mathews',
        password: ''
    }, {
        valueEncoding : 'json'
    }, function (err) {
        if (err) { return callback(err); }

        callback(null, leveldb);
    });
}

function loadAccounts(callback) {
    db.get('atsid', {
        valueEncoding : 'json'
    }, function (err, settings) {
        if (err) { return callback(err); }
        ewsApi.initialize(settings, function (api) {
            callback(null, {
                'atsid': {
                    api: api,
                    settings: settings
                }
            });
        });
    });
}

module.exports.initialize = function (callback) {
    if (!accounts) {
        loadDb(function (err, loadedDb) {
            if (err) { return callback(err); }
            db = loadedDb;

            loadAccounts(function (err, loadedAccounts) {
                if (err) { return callback(err); }
                accounts = loadedAccounts;
                callback(null, accounts);
            });
        });
    } else {
        callback(null, accounts);
    }
};

module.exports.getAccounts = function () {
    return accounts;
};

module.exports.removeAccount = function (name, callback) {
    db.del(name, function (err) {
        if (err) { return callback(err); }
        delete accounts[name];
        callback(null);
    });
};

module.exports.renameAccount = function (oldName, newName, callback) {
    var ops = [
            { type: 'del', key: oldName },
            { type: 'put', key: newName, value: accounts[oldName], valueEncoding: 'json' }
        ];
    db.batch(ops, function (err) {
        if (err) { return callback(err); }
        accounts[newName] = accounts[oldName];
        delete accounts[oldName];
        callback(null);
    });
};

module.exports.addAccount = function (name, settings, callback) {
    db.put(name, settings, function (err) {
        callback(err);
    });
};