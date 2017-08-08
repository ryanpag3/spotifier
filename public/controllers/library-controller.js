"use strict";

var app = angular.module('spotifier');
app.controller('library-controller', ['$scope', '$rootScope', '$timeout', 'libraryService',
    function ($scope, $rootScope, $timeout, libraryService) {

        /**
         *
         */
        $scope.removeArtist = function(artist) {
            libraryService.remove(artist)
                .then(function() {
                    removeArtistLoc(artist);
                })
                .catch(function(err) {
                    console.log(err);
                })
        };

        /**
         * ng-click handler for calling a library sync
         */
        $scope.syncLibrary = function () {
            libraryService.sync();
        };

        /**
         * Event listener that is called from outside library scope to update library UI
         */
        $scope.$on('add-artist', function (event, args) {
            $scope.library.push({
                name: args.artist.name,
                recent_release: {
                    title: 'recent release info pending from Spotify...' // placeholder text matching server
                }
            });
        });

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

        /**
         * Get's a user's library and sets $scope variables based on various sorting keys.
         */
        function getLibrary() {
            libraryService.get()
                .then(function (library) {
                        console.log('updating library');
                        $scope.library = library;
                        // $scope.libraryArtistAscending = sortBy(library, 'name');
                        // $scope.libraryArtistDescending = (sortBy(library, 'name')).reverse();
                        // $scope.libraryTitleAscending = sortBy(library, 'title');
                        // $scope.libraryTitleDescending = (sortBy(library, 'title')).reverse();
                        // $scope.libraryDateAscending = sortBy(library, 'date');
                        // $scope.libraryDateDescending = (sortBy(library, 'date')).reverse();

                });
        }

        /********** HELPER FUNCTIONS **********/

        /**
         * Removes an artist from the local library instance.
         * @param {Object} artist
         */
        function removeArtistLoc(artist) {
            var index = $scope.library.map(function(e) {return e._id}).indexOf(artist._id);
            $scope.library.splice(index, 1);
        }

        /**
         * Adds an artist to the local library instance
         * @param {Object} artist
         * @param {String} artist.name: name of the artist
         */
        function addArtistLoc(artist) {

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

