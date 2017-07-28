var app = angular.module('spotifier');
app.controller('index-controller', ['$scope', '$rootScope', 'apiService',
    function($scope, $rootScope, apiService) {
        var init = function() {
            if ($rootScope.user !== undefined) {
                var authToken = $rootScope.user.accessToken;
                apiService.setAuthToken(authToken);
            }
        };
        init();
}]);