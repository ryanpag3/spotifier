var app = angular.module('spotifier');
app.controller('indexController', ['$scope', 'apiServ', function($scope, apiServ) {
    $scope.search = function(artistName) {
        console.log(artistName);
        apiServ.search(artistName)
            // .then(function(data) {
            //
            // })
            // .catch(function(err) {
            //
            // })
    }
}]);