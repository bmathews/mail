function MailboxesController($scope, $rootScope) {
    var accounts = require('./../lib/accounts');

    $scope.$on('accountsReady', function () {
        var api = accounts.getAccounts()['atsid'].api;

        api.getFolders(function (err, folders) {
            $scope.$apply(function () {
                if (err) {
                    $rootScope.showError(err);
                } else {
                    $scope.folders = folders;
                }
            });
        });
    });

    $scope.showSettings = function () {
        var win = global.gui.Window.open('settings.html', {
            width: 500,
            resizable: false,
            height: 300
            // toolbar: false
        });
        setTimeout(function () {
            win.focus();
        }, 100);
    };


    $scope.selectMailbox = function (folder) {
        $scope.selectedFolder = folder;
        $scope.$emit("selectedFolder", folder);
    };
}