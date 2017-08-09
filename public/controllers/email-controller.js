var app = angular.module('spotifier');

app.controller('email-controller', ['$scope', function($scope) {
    // todo

    /**
     * When a user clicks submit after entering their email and confirming.
     */
    $scope.submit = function() {
        if ($scope.email !== $scope.confirmEmail) {
            $scope.notMatching = true;
        } else {
            $scope.notMatching = false;
            console.log('run the success case!');
        }
    }
}]);