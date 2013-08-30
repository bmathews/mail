var httpntlm = require('./httpntlm'),
    soap = require('soap'),
    path = require('path'),
    xml2js = require('xml2js'),
    crypto = require('crypto'),
    moment = require('moment');

var settings, client, parser = new xml2js.Parser();

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

function getResponseCode(action, res) {
    return getResponseMessage(action, res)['m:ResponseCode'][0];
}

function getResponseMessage(action, res) {
    return res['soap:Envelope']['soap:Body'][0]['m:' + action + 'Response'][0]['m:ResponseMessages'][0]['m:' + action + 'ResponseMessage'][0];
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


            parser.parseString(res.body, function (err, result) {

                if (err) {
                    return callback(err);
                }

                var responseCode = getResponseCode('FindItem', result);

                if (responseCode !== 'NoError') {
                    return callback(new Error(responseCode));
                }

                var rootFolder = getResponseMessage('FindItem', result)['m:RootFolder'][0];
                //TODO: "t:MeetingCancellation"
                var emails = [],
                    msgArray = rootFolder['t:Items'][0]['t:Message'];

                if (msgArray) {
                    if (!msgArray.splice) { msgArray = [msgArray]; }
                    msgArray.forEach(function (item) {
                        emails.push({
                            id: item['t:ItemId'][0]['$'].Id,
                            changeKey: item['t:ItemId'][0]['$'].ChangeKey,
                            subject: item['t:Subject'][0],
                            dateTimeReceived: moment(item['t:DateTimeReceived'][0]).calendar(),
                            size: item['t:Size'][0],
                            importance: item['t:Importance'][0],
                            hasAttachments: (item['t:HasAttachments'][0] === 'true'),
                            from: item['t:From'][0]['t:Mailbox'][0]['t:Name'][0],
                            isRead: (item['t:IsRead'][0] === 'true')
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

            parser.parseString(res.body, function (err, result) {
                if (err) {
                    return callback(err);
                }

                var responseCode = getResponseCode('FindFolder', result);

                if (responseCode !== 'NoError') {
                    return callback(new Error(responseCode));
                }

                var rootFolder = getResponseMessage('FindFolder', result)['m:RootFolder'][0];

                var folders = [];

                rootFolder['t:Folders'][0]['t:Folder'].forEach(function (folder) {
                    folders.push({
                        id: folder['t:FolderId'][0]['$'].Id,
                        name: folder['t:DisplayName'][0],
                        totalCount: folder['t:TotalCount'][0],
                        childFoldercount: folder['t:ChildFolderCount'][0],
                        unreadCount: folder['t:UnreadCount'][0]
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
                // '<t:IncludeMimeContent>true</t:IncludeMimeContent>' +
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

            parser.parseString(res.body, function (err, result) {
                if (err) {
                    return callback(err);
                }

                var responseCode = getResponseCode('GetItem', result);

                if (responseCode !== 'NoError') {
                    return callback(new Error(responseCode));
                }

                var message = getResponseMessage('GetItem', result)['m:Items'][0]['t:Message'][0];

                var item = {
                    subject: message['t:Subject'][0],
                    body: message['t:Body'][0]['_'],
                    from: {
                        emailAddress: message['t:From'][0]['t:Mailbox'][0]['t:EmailAddress'][0],
                        name: message['t:From'][0]['t:Mailbox'][0]['t:Name'][0]
                    },
                    hasAttachments: message['t:HasAttachments'][0],
                    isRead: message['t:IsRead'][0],
                    sensitivity: message['t:Sensitivity'][0],
                    size: message['t:Size'][0]
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