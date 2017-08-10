var app = angular.module('spotifier');

app.controller('email-controller', ['$scope', 'authServ', function($scope, authServ) {
    $scope.matching = true;

    $scope.submitEmail = function() {
        // if inputs are matching
        if ($scope.email === $scope.confirmEmail) {
            $scope.matching = true; // hide err msg
            authServ.submitEmail($scope.email); // submit email to server
        } else {
            $scope.matching = false; // show err msg
        }
    };

}]);