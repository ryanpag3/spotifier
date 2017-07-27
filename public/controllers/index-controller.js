var app = angular.module('spotifier');
app.controller('index-controller', ['$scope', '$rootScope', 'Spotify',
    function($scope, $rootScope, Spotify) {
    $scope.test = function() {
        console.log('test run...');
        Spotify.setAuthToken($rootScope.user.accessToken);
        Spotify.getSavedUserTracks()
            .then(function(data) {
                console.log(data);
            })
    };

    $scope.search = function(artistName) {
        console.log(artistName);
    //     apiService.search(artistName);
    }
}]);