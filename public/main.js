/**
 * Created by ryan on 7/18/2017.
 */
var app = angular.module('spotifier', ['ngRoute', 'spotify']);

app.config(['$routeProvider', '$locationProvider', 'SpotifyProvider',
    function($routeProvider, $locationProvider, SpotifyProvider) {
    // todo add ensure authentication route middleware
    $routeProvider
        .when('/', {
            templateUrl: 'partials/landing.html',
            access: {restricted: false}
        })
        .when('/email', {
            templateUrl: 'partials/email.html',
            access: {restricted: true}
        })
        .when('/confirm-pending', {
            templateUrl: 'partials/confirm-pending.html',
            access: {restricted: true}
        })
        .when('/confirm-success', {
            templateUrl: 'partials/confirm-success.html',
            access: {restricted: false}
        })
        .when('/confirm-failure', {
            templateUrl: 'partials/confirm-failure.html',
            access: {restricted: false}
        })
        .when('/library', {
            templateUrl: 'partials/user-library.html',
            access: {restricted: true}
        });

    $locationProvider.html5Mode(true);
    SpotifyProvider.setClientId('180cc653f1f24ae9864d5d718d68f3c6');
}]);

app.run(function($http, $rootScope, $location, $route, authServ) {
    $rootScope.$on('$routeChangeStart',
        function(event, next, current) {
            authServ.getStatus()
                .then(function(authenticated) {
                    if (next.access.restricted && !authenticated) {
                        $location.path('/');
                        $route.reload();
                    }
                })
        })
});
