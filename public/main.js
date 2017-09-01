/**
 * Created by ryan on 7/18/2017.
 */
var app = angular.module('spotifier', ['ngRoute', 'spotify', 'ui.grid', 'ui.grid.autoResize']);

app.config(['$routeProvider', '$locationProvider', 'SpotifyProvider',
    function ($routeProvider, $locationProvider, SpotifyProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'partials/landing.html',
                access: {restricted: false},
                title: 'Welcome'
            })
            .when('/email', {
                templateUrl: 'partials/email.html',
                access: {restricted: true},
                title: 'Email'
            })
            .when('/unsubscribe', {
                templateUrl: 'partials/unsubscribe.html',
                access: {restricted: false},
                title: 'Unsubscribe'
            })
            .when('/confirmation', {
                templateUrl: 'partials/confirmation.html',
                access: {restricted: false},
                title: 'Confirmation'
            })
            .when('/confirm-pending', {
                templateUrl: 'partials/confirm-pending.html',
                access: {restricted: true},
                title: 'Confirmation Pending'
            })
            .when('/library', {
                templateUrl: 'partials/user-library.html',
                access: {restricted: true},
                title: 'User Library'
            })
            .otherwise('/');


        $locationProvider.html5Mode(true);
        SpotifyProvider.setClientId('180cc653f1f24ae9864d5d718d68f3c6');
    }]);

app.run(function ($http, $rootScope, $location, $route, authService) {
    $rootScope.$on('$routeChangeStart',
        function (event, next, current) {
        // prevent console err thrown for unrecognized routes
        if (next.access) {
                authService.getStatus()
                    .then(function (authenticated) {
                        if (next.access.restricted && !authenticated) {
                            $location.path($location.path('/'));
                            $route.reload();
                        }
                    })
            }

        });
    $rootScope.$on('$routeChangeSuccess', function(current, previous) {
        document.title = 'spotifier.io - ' + $route.current.title;
    });
});
