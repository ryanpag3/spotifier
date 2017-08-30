var app = angular.module('spotifier');

app.controller('email-controller', ['$scope', '$location', '$route', 'authService',
    function ($scope, $location, $route, authService) {
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

        $scope.unsubscribeEmail = function() {
            authService.unsubscribeEmail($scope.email)
                .then(function() {
                   $scope.unsubscribed = true;
                })
                .catch(function() {
                    $scope.unsubscribed = false;
                });
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
            $route.reload();
        }

    }]);