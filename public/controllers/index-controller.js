var app = angular.module('spotifier');
app.controller('index-controller', ['$scope', 'apiService', 'socket', 'Spotify',
    function($scope, apiService, socket, Spotify) {
    $scope.login = function() {
        console.log('scope login called');
        Spotify.login()
            .then(function (data) {
                console.log(data);
            })
            .catch(function (err) {
                console.log(err);
            });
    };

    $scope.search = function(artistName) {
        console.log(artistName);
        apiService.search(artistName);
    }
}]);