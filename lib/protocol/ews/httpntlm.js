var async = require('async');
var httpreq = require('httpreq');
var ntlm = require('./ntlm');
var HttpsAgent = require('agentkeepalive').HttpsAgent;
var keepaliveAgent = new HttpsAgent();

exports.request = function(options, callback){
    if(!options.workstation) options.workstation = '';
    if(!options.domain) options.domain = '';

    async.waterfall([
        function ($){
            var type1msg = ntlm.createType1Message(options);

            httpreq.get(options.url, {
                headers:{
                    'Connection' : 'keep-alive',
                    'Authorization': type1msg
                },
                agent: keepaliveAgent
            }, $);
        },

        function (res, $){

            if(!res.headers['www-authenticate'])
                return $(new Error('www-authenticate not found on response of second request'));

            var type2msg = ntlm.parseType2Message(res.headers['www-authenticate']);
            var type3msg = ntlm.createType3Message(type2msg, options);

            var headers = {
                'Connection' : 'Close',
                'Authorization': type3msg
            };

            // mixin headers
            if (options.headers) {
                for (var prop in options.headers) {
                    headers[prop] = options.headers[prop];
                }
            }

            // console.log(options.url);
            
            httpreq[options.body ? 'post' : 'get'](options.url, {
                headers: headers,
                body: options.body,
                agent: keepaliveAgent
            }, $);
        }
    ], callback);
};