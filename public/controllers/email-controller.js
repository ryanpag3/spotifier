var app = angular.module('spotifier');

app.controller('email-controller', ['$scope', '$location', '$route', 'authService', 'dbService',
    function ($scope, $location, $route, authService, dbService) {
        var user;
        $scope.matching = true;
        $scope.playlistEnabled;
        
        initialize();
        function initialize() {
            user = JSON.parse(sessionStorage.getItem('user'));
            dbService.getPlaylistSetting(user._id)
                .then(function(playlistEnabled) {
                    $scope.playlistEnabled = playlistEnabled;
                });
            dbService.getSyncScheduled(user._id)
                .then(function(scheduled) {
                    $scope.syncScheduled = scheduled;
                });
        };

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

        $scope.playlistEnabledChange = function() {
            // no promise because we don't care if it fails
            dbService.updatePlaylistSetting($scope.playlistEnabled);
        }

        $scope.syncScheduledChange = function() {
            dbService.updateSyncScheduledSetting($scope.syncScheduled);
        }

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