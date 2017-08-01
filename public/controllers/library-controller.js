var app = angular.module('spotifier');
app.controller('library-controller', ['$scope', '$rootScope', '$timeout', 'libraryService',
    function($scope, $rootScope, $timeout, libraryService) {
        init();

        // sort by date added
        $scope.library = [];
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
            libraryService.sync();
        };
        function init() {
            libraryService.get()
                .then(function(library) {
                    $scope.library = library;
                });
        }

}]);