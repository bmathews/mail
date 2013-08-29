function MessageController($scope, $rootScope, $sce) {
    var ewsApi = require('./../lib/protocol/ews/api'),
        api;

    ewsApi.initialize({
        url: 'owa.atsid.com',
        username: 'brian.mathews',
        password: ''
    }, function (inst) {
        api = inst;
    });
    
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
}