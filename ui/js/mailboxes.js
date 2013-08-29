function MailboxesController($scope) {
  var ewsApi = require('./../lib/protocol/ews/api');

    ewsApi.initialize({
        url: 'owa.atsid.com',
        username: 'brian.mathews',
        password: ''
    }, function (api) {
        api.getFolders(function (err, folders) {
            $scope.$apply(function () {
                $scope.folders = folders;
                $scope.selectedFolder = folders[0];
            });
            console.log("GOT FOLDERS: " + folders.length);
            console.log("Getting mail for: " + folders[0].name + " (" + folders[0].unreadCount + " unread)\n\n");
            api.getEmails(folders[0].id, {}, function (err, emails) {
                console.log("GOT EMAILS: " + emails.length);
            });
        });
    });

    $scope.selectMailbox = function (folder) {
        $scope.selectedFolder = folder;
        $scope.$emit("selectedFolder", folder);
    };
}