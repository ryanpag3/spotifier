var app = angular.module('spotifier');

app.controller('email-controller', ['$scope', '$location', 'authService',
    function ($scope, $location, authService) {
        $scope.matching = true;

        $scope.submitEmail = function () {
            // if inputs are matching
            if ($scope.email === $scope.confirmEmail) {
                $scope.matching = true; // hide err msg
                authService.submitEmail($scope.email); // submit email to server
            } else {
                $scope.matching = false; // show err msg
            }
        };

        /**
         * Ng-click handler for sending a confirmation again.
         */
        $scope.resendConfirmation = function () {
            authService.sendConfirmationEmail();
        };

        /**
         * routes user to email entry page
         */
        $scope.reenterEmail = function () {
            $location.path('/email');
        }

    }]);