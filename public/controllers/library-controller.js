var app = angular.module('spotifier');
app.controller('library-controller', ['$scope', '$rootScope', 'apiService', 'dbService',
    function($scope, $rootScope, apiService, dbService) {
        // sort by date added
        $scope.library = {};
        $scope.libraryReversed = {};
        // sort by artist
        $scope.libraryArtistAscending = {};
        $scope.libraryArtistDescending = {};
        // sort by release title
        $scope.libraryReleaseTitleAscending = {};
        $scope.libraryReleaseTitleDescending = {};
        // sort by release date
        $scope.libraryReleaseDateAscending = {};
        $scope.libraryReleaseDateDescending = {};


        $scope.syncLibrary = function() {
            apiService.syncLibrary();
        };
        function init() {
            dbService.getLibrary()
                .then(function(library) {
                    $scope.library = library;
                });
        }
        init();
}]);