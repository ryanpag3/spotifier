var app = angular.module('spotifier');
app.controller('library-controller', ['$scope', '$rootScope', '$timeout', 'libraryService',
    function($scope, $rootScope, $timeout, libraryService) {


        // sort by date added
        $scope.library = [];
        $scope.libraryReversed = {};
        // sort by artist
        $scope.libraryArtistAscending = [];
        $scope.libraryArtistDescending = [];
        // sort by release title
        $scope.libraryTitleAscending = [];
        $scope.libraryTitleDescending = [];
        // sort by release date
        $scope.libraryDateAscending = [];
        $scope.libraryDateDescending = [];

        init();
        $scope.syncLibrary = function() {
            libraryService.sync();
        };
        function init() {
            libraryService.get()
                .then(function(library) {
                    $scope.library = library;
                    $scope.libraryArtistAscending = sortBy(library, 'name');
                    $scope.libraryArtistDescending = (sortBy(library, 'name')).reverse();
                    $scope.libraryTitleAscending = sortBy(library, 'title');
                    $scope.libraryTitleDescending = (sortBy(library, 'title')).reverse();
                    $scope.libraryDateAscending = sortBy(library, 'date');
                    $scope.libraryDateDescending = (sortBy(library, 'date')).reverse();
                });
        }

        // sorting utility for user libraries
        function sortBy(array, key) {
            switch (key) {
                case 'name':
                    return array.sort(function(a,b) {
                        var aName = a.name.toLowerCase();
                        var bName = b.name.toLowerCase();

                        if (aName < bName){
                            return -1;
                        }
                        if (aName > bName){
                            return 1;
                        }
                        return 0;
                    }).slice();
                case 'title':
                    return array.sort(function(a,b) {
                        var aTitle = a.recent_release.title.toLowerCase();
                        var bTitle = b.recent_release.title.toLowerCase();

                        if (aTitle < bTitle){
                            return -1;
                        }
                        if (aTitle > bTitle){
                            return 1;
                        }
                        return 0;
                    }).slice();
                case 'date':
                    return array.sort(function(a,b) {
                        var aDate = new Date(a.recent_release.release_date);
                        var bDate = new Date(b.recent_release.release_date);
                        if (aDate < bDate) {
                            return -1;
                        }
                        if (aDate > bDate) {
                            return 1;
                        }
                        return 0;
                    }).slice();
            }
        }
    }
]);