/**
 * Controller which handles the listing of errors
 */
angular.module("common.error", [])
    .controller("ErrorController", ['$dialog', '$rootScope', function($dialog, $rootScope) {
        var d = $dialog.dialog({
            backdrop: false,
            keyboard: true,
            backdropClick: false,
            dialogFade: true
        });

        // Watch for errors on the root scope, then report them
        $rootScope.$watch("errors.length", function(newVal) {
            if (newVal && !d._open) {
                d.open('js/common/error/errorList.tpl.html', ['$scope', function($scope) {
                    $scope.close = function() {
                        d.close();
                    };
                }]).then(function() {
                    $rootScope.errors.length = 0;
                });
            } else if (!newVal && d._open) {
                d.close();
            }
        }, true);

    }]);