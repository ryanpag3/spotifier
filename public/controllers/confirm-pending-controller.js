var app = angular.module('spotifier');
app.controller('confirm-pending-controller', ['$scope', '$location', '$route', 'authServ',
    function($scope, $location, $route, authServ) {
    onLoad();
    function onLoad() {
        authServ.getEmailStatus()
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