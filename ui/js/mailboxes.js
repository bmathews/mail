function MailboxesController($scope, $rootScope) {
    var ewsApi = require('./../lib/protocol/ews/api');

    ewsApi.initialize({
        url: 'owa.atsid.com',
        username: 'brian.mathews',
        password: ''
    }, function (api) {
        api.getFolders(function (err, folders) {
            $scope.$apply(function () {
                if (err) {
                    $rootScope.showError(err);
                } else {
                    $scope.folders = folders;
                    $scope.selectedFolder = folders[0];
                }
            });
        });
    });

    $scope.selectMailbox = function (folder) {
        $scope.selectedFolder = folder;
        $scope.$emit("selectedFolder", folder);
    };
}