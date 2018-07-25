var app = angular.module('spotifier');
app.controller('confirmation-controller', ['$scope', '$location', '$route', '$routeParams',
    function ($scope, $location, $route, $routeParams) {
        init();
        function init() {
            $scope.success = $routeParams.success;
            // if query parameter is invalid
            if ($scope.success !== 'true' && $scope.success !== 'false') {
                // reroute to home page and replace invalid url in history
                $location.url($location.path('/').replace());
            }
        }

    }]);