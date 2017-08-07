"use strict";

var app = angular.module('spotifier');
app.controller('library-controller', ['$scope', '$rootScope', '$timeout', 'libraryService',
    function ($scope, $rootScope, $timeout, libraryService) {


        // sort by date added
        $scope.library = [];
        $scope.libraryReversed = [];
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

        function init() {
            getLibrary();
        }

        $scope.syncLibrary = function () {
            libraryService.sync();
        };


        $scope.$on('update-library', function () {
            getLibrary();
        });

        function getLibrary() {
            libraryService.get()
                .then(function (library) {
                    $scope.library = library;
                    $scope.libraryArtistAscending = sortBy(library, 'name');
                    $scope.libraryArtistDescending = (sortBy(library, 'name')).reverse();
                    $scope.libraryTitleAscending = sortBy(library, 'title');
                    $scope.libraryTitleDescending = (sortBy(library, 'title')).reverse();
                    $scope.libraryDateAscending = sortBy(library, 'date');
                    $scope.libraryDateDescending = (sortBy(library, 'date')).reverse();
                });
        }

        /**
         * Each sort creates a copy of the array parameter sorts it by a specified key value, and returns the result.
         * @param array: library artists
         * @param key: sorting key based on object key types.
         * @returns {Array}: the sorted array
         */
        function sortBy(array, key) {
            switch (key) {
                case 'name':
                    return array.slice().sort(function (a, b) {
                        var aName = a.name.toLowerCase();
                        var bName = b.name.toLowerCase();

                        if (aName < bName) {
                            return -1;
                        }
                        if (aName > bName) {
                            return 1;
                        }
                        return 0;
                    });
                case 'title':
                    return array.slice().sort(function (a, b) {
                        var aTitle = a.recent_release.title.toLowerCase();
                        var bTitle = b.recent_release.title.toLowerCase();

                        if (aTitle < bTitle) {
                            return -1;
                        }
                        if (aTitle > bTitle) {
                            return 1;
                        }
                        return 0;
                    });
                case 'date':
                    return array.slice().sort(function (a, b) {
                        var aDate = new Date(a.recent_release.release_date);
                        var bDate = new Date(b.recent_release.release_date);
                        if (aDate < bDate) {
                            return -1;
                        }
                        if (aDate > bDate) {
                            return 1;
                        }
                        return 0;
                    });
            }
        }
    }
]);

