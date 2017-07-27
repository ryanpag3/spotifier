/**
 * Created by ryan on 7/18/2017.
 */
var app = angular.module('spotifier', ['ngRoute', 'spotify']);

app.config(['$routeProvider', '$locationProvider', 'SpotifyProvider',
    function($routeProvider, $locationProvider, SpotifyProvider) {
    // TODO
    // add routes for each partial
    // add ensure authentication route middleware
    $routeProvider
        .when('/login', {
            templateUrl: 'partials/login.html',
            restricted: false
        })
        .when('/library', {
            templateUrl: 'partials/user-library.html',
            restricted: true
        });

    $locationProvider.html5Mode(true);
    // TODO: retrieve these variables at runtime from server to avoid exposing them in production
    SpotifyProvider.setClientId('180cc653f1f24ae9864d5d718d68f3c6');
    SpotifyProvider.setRedirectUri('http://localhost:3000/user/callback');
    SpotifyProvider.setScope('user-read-private user-read-email user-library-read')

}]);

app.run(function($http, $rootScope, $location) {
    $http.get('/user/confirm-login')
        .then(function(res) {
            console.log(res.data.user);
            $rootScope.user = res.data.user;
        })
        .catch(function(err) {
            console.log('ERROR: ' + err);
        })
});
