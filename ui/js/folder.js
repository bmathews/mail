function FolderController($scope, $rootScope) {
    var ewsApi = require('./../lib/protocol/ews/api'),
        api;

    ewsApi.initialize({
        url: 'owa.atsid.com',
        username: 'brian.mathews',
        password: ''
    }, function (inst) {
        api = inst;
    });

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
}