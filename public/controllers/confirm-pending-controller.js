var app = angular.module('spotifier');
app.controller('confirm-pending-controller', ['$scope', '$location', '$route', 'authService',
    function($scope, $location, $route, authService) {
    onLoad();
    function onLoad() {
        authService.getEmailStatus()
            .then(function(confirmed) {
                if (confirmed) {
                    $location.path('/library');
                    $route.reload();
                }
            })
            .catch(function(err) {
                console.log(err);
            })
    }
}]);