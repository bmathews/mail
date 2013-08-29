'use strict';

/**
 * Application module
 */
angular.module('WebApp', ['common.error', 'ui.bootstrap'])
    .run(['$rootScope', function ($rootScope) {

        $rootScope.errors = [];

        /**
         * Creates an error handler with the given message
         * @param message
         * @returns {Function}
         */
        $rootScope.createErrorHandler = function (message) {
            return function(resp) {
                $rootScope.showError(message);
            };
        };

        /**
         * Shows an error
         * @param {String} message Error message to show
         */
        $rootScope.showError = function (message) {
            $rootScope.errors.push(angular.isString(message) ? message : '');
        };
    }]);
