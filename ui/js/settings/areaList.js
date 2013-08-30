function AreaListController($scope, $rootScope) {
    var accountManager = require('./../lib/accounts');
    var accountMap = accountManager.getAccounts();
    var accounts = [];

    for (var name in accountMap) {
        accounts.push({
            name: name,
            account: accountMap[name]
        });
    }

    $scope.accounts = accounts;

    $scope.selectAccount = function (account) {
        $scope.selectedAccount = account;
        $scope.$emit('accountSelected', account);
    };

    $scope.newAccount = function () {
        $scope.accounts.push({
            name: "Untitled",
            account: null
        });
    };
}