function MessageController($scope, $rootScope, $element, $timeout) {

    function replaceImages(id, content) {
        $($element).find('img').splice(0).forEach(function (img) {
            if (img.src.indexOf('cid:' + id) === 0) {
                img.src = 'data:image/png;base64,' + content;
            }
        });
    }

    $scope.$on('accountsReady', function () {
        var accounts = require('./../lib/accounts').getAccounts(),
            api = accounts['atsid'].api;

        $rootScope.$on('selectedFolder', function () {
            $scope.email = null;
        });
        $rootScope.$on('selectedEmail', function (e, msgEmail) {
            $scope.email = null;
            api.getEmailById(msgEmail.id, function (err, email) {
                $scope.$apply(function () {
                    if (err) {
                        $rootScope.showError(err);
                    } else {
                        if (!email.isRead) {
                            $timeout(function () {
                                if ($scope.email.id === email.id) {
                                    api.markAsRead(email.id, email.changeKey, function (err) {
                                        msgEmail.isRead = true;
                                        email.isRead = true;
                                        if (err) {
                                            $rootScope.showError(err);
                                        }
                                    });
                                }
                            }, 4000);
                        }
                        if (email.body.indexOf("</body>") > -1) {
                            email.body = email.body.substr(email.body.indexOf("<body"));
                            email.body = email.body.substr(email.body.indexOf('>') + 1);
                            email.body = email.body.substr(0, email.body.indexOf("</body>"));
                        } else {
                            email.body = '<div class="plain">' + email.body + '</div>';
                        }
                        email.body = email.body;
                        $scope.email = email;
                    }

                    // download inline attachments with a contentId
                    if (email.attachments.length) {
                        email.attachments.forEach(function (attachment) {
                            if (attachment.contentId) {
                                api.getAttachment(attachment.id, function (err, res) {
                                    replaceImages(attachment.contentId, res.content);
                                });
                            }
                        });
                    }
                });
            });
        });
    });
}