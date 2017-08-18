"use strict";

var app = angular.module('spotifier');
app.controller('library-controller', ['$scope', '$location', '$rootScope', '$timeout', 'libraryService',
    function ($scope, $location, $rootScope, $timeout, libraryService) {

        var prevQuery;
        var srcLibrary = [];
        $scope.syncButtonShown = true;
        $scope.enqueued = 'enqueued';
        $scope.active = 'active';
        $scope.results = null;
        $scope.resultBoxShown = false;
        $scope.resultsShown = false;

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


        /**
         * initialization code for this controller
         */
        function init() {
            getLibrary(); // request library
            libraryService.getSyncStatus() // request sync job status
                .then(function (status) {
                    $scope.syncStatus = status;
                })
        }

        init(); // run initialization code

        /**
         * caller method for search form
         * parses the query to eliminate unnecessary white space. If the query matches the previous
         * query and it is not empty, shows cached results. If the query is not the same as the
         * previous and not empty, calls the libraryService search function which handles the AJAX
         * call to the API.
         **/
        $scope.search = function (query) {
            $scope.resultBoxShown = true;
            $scope.resultsShown = false;
            $scope.resultSpinnerShown = true;

            // trim query
            var mQuery = query.trim();
            // if not same as previous and not empty
            if (mQuery === prevQuery && mQuery !== '') {
                $scope.resultSpinnerShown = false;
                // display previous results
                $scope.resultsShown = true;
            }
            // if not empty
            else if (mQuery !== '') {
                libraryService.searchSpotify(mQuery)
                    .then(function (res) {
                        prevQuery = mQuery;
                        $scope.results = res;
                        $scope.resultSpinnerShown = false;
                        $scope.resultsShown = true;
                    })
                    .catch(function (err) {

                    });
                $(function () {
                    $('#spotify-search').blur();
                })
            }
        };

        /**
         * ng-click handler for adding an artist to a user library. Calls the library service which
         * handles the AJAX call to the server, and on success calls pushArtistToLibrary which pushes
         * a local instance of an artist object to the library.
         * @param artist
         */
        $scope.add = function (artist) {
            console.log(artist);
            libraryService.add(artist)
                .then(function () {
                    pushArtistToLibrary(artist);
                })
                .catch(function () {
                    // todo handle service error response
                })
        };

        /**
         * Pushes an artist to the library when the add request is sent to the server
         * to allow for instant UI updates.
         */
        function pushArtistToLibrary(artist) {
            $scope.library.push({
                name: artist.name,
                spotify_id: artist.spotify_id,
                recent_release: {
                    title: 'release info requested from Spotify, pending...' // placeholder text matching server
                }
            });
        };

        /**
         * ng-click function fof removing an artist for a user
         */
        $scope.removeArtist = function (artist) {
            console.log(artist);
            libraryService.remove(artist)
                .then(function () {
                    removeArtistLoc(artist);
                })
                .catch(function (err) {
                    console.log(err);
                })
        };

        /**
         * ng-click handler for calling a library sync
         */
        $scope.syncLibrary = function () {
            libraryService.sync()
                .then(function () {
                    $scope.syncStatus = 'enqueued';
                    $location.path('/library');
                })
        };

        /**
         * ng-click handler for removing a user from the sync job queue
         */
        $scope.cancelSyncLibrary = function () {
            libraryService.cancelSync()
                .then(function () {
                    $scope.syncStatus = 'not queued';
                })
        };

        /**
         * Get's a user's library and sets $scope variables based on various sorting keys.
         */
        function getLibrary() {
            libraryService.get()
                .then(function (library) {
                    // solution for this found @
                    // https://stackoverflow.com/a/38317754/7977846
                    var libraryChunks = chunk(library, 25);
                    $scope.library = libraryChunks[0];
                    var delay = 100;
                    angular.forEach(libraryChunks, function(value, index) {
                        delay += 100;

                        // skip the first chuck
                        if( index > 0 ) {
                            $timeout(function() {
                                Array.prototype.push.apply($scope.library,value);
                            }, delay);
                        }
                    });
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
            var index = $scope.library.map(function (e) {
                return e._id
            }).indexOf(artist._id);
            $scope.library.splice(index, 1);
        }

        function chunk (arr, len) {
            var chunks = [],
                i = 0,
                n = arr.length;
            while (i < n) {
                chunks.push(arr.slice(i, i += len));
            }
            return chunks;
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

        /** JQUERY **/
        // todo convert to a directive
        // handle clicking outside search results
        $(document).mouseup(function (e) {
            var container = $(".search");
            // if the target of the click isn't the container nor a descendant of the container
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                $scope.resultBoxShown = false;
                $scope.$apply();
            }
        });
    }]);

