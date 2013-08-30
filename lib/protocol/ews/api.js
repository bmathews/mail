var httpntlm = require('./httpntlm'),
    soap = require('soap'),
    path = require('path'),
    xml2js = require('xml2js'),
    crypto = require('crypto'),
    moment = require('moment');

var settings, client;

function API(soapClient, soapSettings) {
    settings = soapSettings;
    client = soapClient;
}

function makeRequest (body, headers, callback) {
    httpntlm.request({
        url: 'https://' + settings.url + '/EWS/Exchange.asmx',
        username: settings.username,
        password: settings.password,
        workstation: '',
        domain: '',
        body: body,
        headers: headers
    }, function (err, res) {
        callback(err, res);
    });
}

//folderId, {offset, count}
API.prototype.getEmails = function (folderId, options, callback) {
    var soapRequest =
        '<tns:FindItem Traversal="Shallow" xmlns:tns="http://schemas.microsoft.com/exchange/services/2006/messages">' +
            '<tns:ItemShape>' +
                '<t:BaseShape>IdOnly</t:BaseShape>' +
                '<t:AdditionalProperties>' +
                    '<t:FieldURI FieldURI="item:ItemId"></t:FieldURI>' +
                // '<t:FieldURI FieldURI="item:ConversationId"></t:FieldURI>' +
                // '<t:FieldURI FieldURI="message:ReplyTo"></t:FieldURI>' +
                // '<t:FieldURI FieldURI="message:ToRecipients"></t:FieldURI>' +
                // '<t:FieldURI FieldURI="message:CcRecipients"></t:FieldURI>' +
                // '<t:FieldURI FieldURI="message:BccRecipients"></t:FieldURI>' +
                    '<t:FieldURI FieldURI="item:DateTimeCreated"></t:FieldURI>' +
                    '<t:FieldURI FieldURI="item:DateTimeSent"></t:FieldURI>' +
                    '<t:FieldURI FieldURI="item:HasAttachments"></t:FieldURI>' +
                    '<t:FieldURI FieldURI="item:Size"></t:FieldURI>' +
                    '<t:FieldURI FieldURI="message:From"></t:FieldURI>' +
                    '<t:FieldURI FieldURI="message:IsRead"></t:FieldURI>' +
                    '<t:FieldURI FieldURI="item:Importance"></t:FieldURI>' +
                    '<t:FieldURI FieldURI="item:Subject"></t:FieldURI>' +
                    '<t:FieldURI FieldURI="item:DateTimeReceived"></t:FieldURI>' +
                '</t:AdditionalProperties>' +
            '</tns:ItemShape>' +
            '<tns:IndexedPageItemView BasePoint="Beginning" Offset="' + (options.offset || 0) + '" MaxEntriesReturned="' + (options.count || 10) + '"></tns:IndexedPageItemView>' +
            '<tns:ParentFolderIds>' +
                '<t:FolderId Id="' + folderId + '"></t:FolderId>' +
            '</tns:ParentFolderIds>' +
        '</tns:FindItem>';


    // get soap request options
    client.FindItem(soapRequest, function (reqOptions) {

        //perform request
        makeRequest(reqOptions.xml, reqOptions.headers, function (err, res) {

            if (err) {
                return callback(err);
            }

            var parser = new xml2js.Parser();

            parser.parseString(res.body, function (err, result) {

                if (err) {
                    return callback(err);
                }

                var responseCode = result['soap:Body']['m:FindItemResponse']['m:ResponseMessages']['m:FindItemResponseMessage']['m:ResponseCode'];

                if (responseCode !== 'NoError') {
                    return callback(new Error(responseCode));
                }

                var rootFolder = result['soap:Body']['m:FindItemResponse']['m:ResponseMessages']['m:FindItemResponseMessage']['m:RootFolder'];

                var emails = [],
                    msgArray = rootFolder['t:Items']['t:Message'];

                if (msgArray) {
                    if (!msgArray.splice) { msgArray = [msgArray]; }
                    msgArray.forEach(function (item) {
                        emails.push({
                            id: item['t:ItemId']['@'].Id,
                            changeKey: item['t:ItemId']['@'].ChangeKey,
                            subject: item['t:Subject'],
                            dateTimeReceived: moment(item['t:DateTimeReceived']).calendar(),
                            size: item['t:Size'],
                            importance: item['t:Importance'],
                            hasAttachments: (item['t:HasAttachments'] === 'true'),
                            from: item['t:From']['t:Mailbox']['t:Name'],
                            isRead: (item['t:IsRead'] === 'true')
                        });
                    });
                }

                callback(null, emails);
            });
        });
    });
};

// get a flat list of all folders
API.prototype.getFolders = function (callback) {
    var soapRequest =
        '<FindFolder Traversal="Shallow" xmlns="http://schemas.microsoft.com/exchange/services/2006/messages">' +
          '<FolderShape>' +
            '<t:BaseShape>Default</t:BaseShape>' +
          '</FolderShape>' +
          '<ParentFolderIds>' +
            '<t:DistinguishedFolderId Id="msgfolderroot"/>' +
          '</ParentFolderIds>' +
        '</FindFolder>';

    client.FindFolder(soapRequest, function (reqOptions) {
        makeRequest(reqOptions.xml, reqOptions.headers, function (err, res) {

            if (err) {
                return callback(err);
            }

            var parser = new xml2js.Parser();

            parser.parseString(res.body, function (err, result) {
                if (err) {
                    return callback(err);
                }

                var responseCode = result['soap:Body']['m:FindFolderResponse']['m:ResponseMessages']['m:FindFolderResponseMessage']['m:ResponseCode'];

                if (responseCode !== 'NoError') {
                    return callback(new Error(responseCode));
                }

                var rootFolder = result['soap:Body']['m:FindFolderResponse']['m:ResponseMessages']['m:FindFolderResponseMessage']['m:RootFolder'];

                var folders = [];

                rootFolder['t:Folders']['t:Folder'].forEach(function (folder) {
                    folders.push({
                        id: folder['t:FolderId']['@'].Id,
                        name: folder['t:DisplayName'],
                        totalCount: folder['t:TotalCount'],
                        childFoldercount: folder['t:ChildFolderCount'],
                        unreadCount: folder['t:UnreadCount']
                    });
                });

                callback(null, folders);
            });
            
        });
    });
};

// get an email message by id
API.prototype.getEmailById = function (id, callback) {
    var soapRequest =
            '<GetItem ' +
                ' xmlns="http://schemas.microsoft.com/exchange/services/2006/messages"' +
                ' xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types">' +
              '<ItemShape>' +
                '<t:BaseShape>Default</t:BaseShape>' +
                '<t:IncludeMimeContent>true</t:IncludeMimeContent>' +
              '</ItemShape>' +
              '<ItemIds>' +
                '<t:ItemId Id="' + id + '" />' +
              '</ItemIds>' +
            '</GetItem>';

    client.GetItem(soapRequest, function (reqOptions) {
        makeRequest(reqOptions.xml, reqOptions.headers, function (err, res) {

            if (err) {
                return callback(err);
            }

            var parser = new xml2js.Parser();

            parser.parseString(res.body, function (err, result) {
                if (err) {
                    return callback(err);
                }

                var responseCode = result['soap:Body']['m:GetItemResponse']['m:ResponseMessages']['m:GetItemResponseMessage']['m:ResponseCode'];

                if (responseCode !== 'NoError') {
                    return callback(new Error(responseCode));
                }

                var message = result['soap:Body']['m:GetItemResponse']['m:ResponseMessages']['m:GetItemResponseMessage']['m:Items']['t:Message'];

                var item = {
                    subject: message['t:Subject'],
                    body: message['t:Body']['#']
                };

                callback(null, item);
            });
            
        });
    });
};

module.exports.initialize = function (settings, callback) {

    /**
     * Create the SOAP EWS client
     */
    function createClient(url, callback) {
        var soap = require('soap');
        var endpoint = 'https://' + url + '/EWS/Exchange.asmx';
        var servicesUrl = path.join(__dirname, 'mappings', 'Services.wsdl');

        soap.createClient(servicesUrl, {}, function (err, client) {
            if (err) {
                return callback(err);
            }
            if (!client) {
                return callback(new Error('Could not create client'));
            }

            return callback(client);
        }, endpoint);
    }

    /**
     * Create the soap client, create api, return
     */
    createClient(settings.url, function (client) {
        var api = new API(client, settings);
        callback(api);
    });
};