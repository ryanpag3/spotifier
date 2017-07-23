/**
 * Created by ryan on 7/18/2017.
 */
var app = angular.module('spotifier', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
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
}]);
