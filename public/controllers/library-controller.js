var app = angular.module('spotifier');
app.controller('library-controller', ['$scope', '$rootScope', 'apiService',
    function($scope, $rootScope, apiService) {
    $scope.syncLibrary = function() {
        apiService.syncLibrary();
    }
}]);