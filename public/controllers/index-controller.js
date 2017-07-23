var app = angular.module('spotifier');
app.controller('index-controller', ['$scope', 'apiService', 'socket',
    function($scope, apiService, socket) {

    $scope.search = function(artistName) {
        console.log(artistName);
        apiService.search(artistName);
    }
}]);