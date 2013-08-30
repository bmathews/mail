function MessageController($scope, $rootScope, $sce) {

    $scope.$on('accountsReady', function () {
        var accounts = require('./../lib/accounts').getAccounts(),
            api = accounts['atsid'].api;

        $rootScope.$on('selectedFolder', function () {
            $scope.email = null;
        });
        $rootScope.$on('selectedEmail', function (e, email) {
            $scope.email = null;
            api.getEmailById(email.id, function (err, email) {
                $scope.$apply(function () {
                    if (err) {
                        $rootScope.showError(err);
                    } else {
                        if (email.body.indexOf("</body>") > -1) {
                            email.body = email.body.substr(email.body.indexOf("<body"));
                            email.body = email.body.substr(email.body.indexOf('>') + 1);
                            email.body = email.body.substr(0, email.body.indexOf("</body>"));
                        } else {
                            email.body = '<div class="plain">' + email.body + '</div>';
                        }
                        email.body = $sce.trustAsHtml(email.body);
                        $scope.email = email;
                    }
                });
            });
        });
    });
}