function MessageController($scope, $rootScope, $sce) {

    $scope.$on('accountsReady', function () {
        var accounts = require('./../lib/accounts').getAccounts(),
            api = accounts['atsid'].api;

        
        $rootScope.$on('selectedEmail', function (e, email) {
            api.getEmailById(email.id, function (err, email) {
                $scope.$apply(function () {
                    if (err) {
                        $rootScope.showError(err);
                    } else {
                        email.body = email.body.substr(email.body.indexOf("<body"));
                        email.body = email.body.substr(email.body.indexOf('>') + 1);
                        email.body = $sce.trustAsHtml(email.body.substr(0, email.body.indexOf("</body>")));
                        $scope.email = email;
                    }
                });
            });
        });
    });
}