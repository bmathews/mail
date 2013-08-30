function FolderController($scope, $rootScope) {

    $scope.$on('accountsReady', function () {
        var accounts = require('./../lib/accounts').getAccounts(),
            api = accounts['atsid'].api;

        $rootScope.$on('selectedFolder', function (e, folder) {
            $scope.emails = null;
            api.getEmails(folder.id, {}, function (err, emails) {
                $scope.$apply(function () {
                    if (err) {
                        $rootScope.showError(err);
                    } else {
                        $scope.emails = emails;
                    }
                });
            });
        });

        $scope.selectEmail = function (email) {
            $scope.selectedEmail = email;
            $scope.$emit("selectedEmail", email);
        };
    });
}