function MailboxesController($scope, $rootScope) {
    var accounts = require('./../lib/accounts'),
        api;

    function getFolders(id, parent) {
        api.getFolders(id, function (err, folders) {
            $scope.$apply(function () {
                if (err) {
                    $rootScope.showError(err);
                } else {
                    if (id && parent) {
                        parent.children = folders;
                    } else {
                        $scope.folders = folders;
                    }
                    folders.forEach(function (folder) {
                        if (folder.childFolderCount > 0) {
                            getFolders(folder.id, folder);
                        }
                    });
                }
            });
        });
    }

    $scope.$on('accountsReady', function () {
        api = accounts.getAccounts()['atsid'].api;
        getFolders();
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