function AccountEditorController($scope, $rootScope) {
    var accountManager = require('./../lib/accounts');
    var accountMap = accountManager.getAccounts();

    $rootScope.$on('accountSelected', function (e, account) {
        $scope.selectedAccount = account;
    });

    $scope.saveAccount = function () {

    };
}