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
        .when('/', {
            templateUrl: 'partials/landing.html',
            restricted: false
        })
        .when('/library', {
            templateUrl: 'partials/user-library.html',
            restricted: true
        });

    $locationProvider.html5Mode(true);
    SpotifyProvider.setClientId('180cc653f1f24ae9864d5d718d68f3c6');
}]);

app.run(function($http, $rootScope, $location) {

});
