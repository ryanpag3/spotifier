"use strict";

var app = angular.module('spotifier');
app.controller('library-controller', ['$scope', '$location', '$rootScope',
    '$timeout', '$window', '$filter', 'libraryService', 'authService', 'socket',
    function ($scope, $location, $rootScope, $timeout, $window, $filter, libraryService, authService, socket) {

        var prevQuery;
        $scope.results = null;
        $scope.data = [];
        $scope.syncButtonShown = true;
        $scope.resultBoxShown = false;
        $scope.resultsShown = false;

        $scope.artistName = '';
        $scope.enqueued = 'enqueued';
        $scope.active = 'active';

        // define ui-grid api options
        $scope.gridOptions = {
            columnDefs: [
                {
                    name: 'removeButton',
                    displayName: '',
                    cellTemplate: '<div data-ng-mouseenter="hover=true" data-ng-mouseleave="hover=false" style=""><button ' +
                    'data-ng-click="grid.appScope.removeArtist(row.entity)" ' +
                    'data-ng-class="hover ? \' social-fa-btn remove-button fa-btn fa fa-times fa-2x \' : \' social-fa-btn added-button fa-btn fa fa-check fa-2x \'"></button></div>',
                    width: 40
                },
                {
                    name: 'art',
                    displayName: '',
                    cellTemplate: '<div data-ng-style="{\'background-image\' : \'url(\' + row.entity.recent_release.images[2].url + \')\'}"\n' +
                    'id="artist-release-art" class="artist-element"></div>',
                    width: 50, enableSorting: false,
                    enableHiding: false,
                    cellClass: 'grid-artist-column'
                },
                {name: 'name', field: 'name', displayName: 'Artist', minWidth: 100, cellClass: 'grid-center-text-vert'},
                {
                    name: 'title',
                    displayName: 'Recent Release Title',
                    field: 'recent_release.title',
                    cellClass: 'grid-center-album-link',
                    cellTemplate: '<a class="release-link" href="{{row.entity.recent_release.url}}" target="_blank">{{row.entity.recent_release.title}}</a>'
                },
                {
                    name: 'releaseDate',
                    field: 'recent_release.release_date',
                    displayName: 'Date',
                    width: 100,
                    minWidth: 100,
                    cellClass: 'grid-center-text-vert'
                }
            ],
            excessRows: 25,
            rowHeight: 45,
            enableColumnMenus: false
        };

        /**
         * initialization code for this controller
         */
        function init() {
            // display help text if library is empty
            if ($scope.data.length < 1) {
                $scope.libraryEmpty = true;
            }

            // serialize user info to session storage if it doesn't already exist
            // todo: currently replacing every time due to mongodb wipes for debugging
            // todo: turn caching back on
            authService.serializeSessionUser()
                .then(function () {
                    var user = JSON.parse(sessionStorage.getItem('user'));
                    socket.emit('add-user', user);
                })
                .catch(function (err) {
                    // do nothing
                });
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
            // trim query
            var mQuery = query.trim();
            if (mQuery !== ''){
                $scope.resultSpinnerShown = true;
            }

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
                        // check and see if query contains artists already added
                        for (var i = 0; i < res.length; i++) {
                            var index = $scope.gridOptions.data.map(function (e) {
                                return e.spotify_id
                            }).indexOf(res[i].spotify_id);
                            if (index !== -1) {
                                res[i].artistAdded = true;
                            }
                        }

                        $scope.results = res;
                        $scope.resultSpinnerShown = false;
                        $scope.resultsShown = true;
                    })
                    .catch(function (err) {
                        // do nothing
                    });
                $(function () {
                    $('#spotify-search').blur();
                })
            }
        };

        /**
         * Solution for this found @:
         * https://stackoverflow.com/questions/26232723/angularjs-ui-grid-filter-from-text-input-field
         * ui-grid does not have a native global filter so what we do is apply our own filter to the data
         * on ng-change based on the source which we define by $scope.data and then the filter key, which in
         * this case is the ng-model for the search bar, $scope.artistName.
         *
         * another possible solution: http://plnkr.co/edit/ZjsDQ8dp9XWELAOGvyBw?p=preview
         * but has a limitation to one column used as the search key
         * possible todo: rename search bar variable to properly represent new search scope
         */
        $scope.filterGrid = function () {
            $scope.gridOptions.data = $filter('filter')($scope.data, $scope.artistName);
            if ($scope.artistName === '') {
                $scope.gridOptions.data = $scope.data;
            }
        };

        /**
         * ng-click handler for adding an artist to a user library. Calls the library service which
         * handles the AJAX call to the server, and on success calls pushArtistToLibrary which pushes
         * a local instance of an artist object to the library.
         * @param artist
         */
        $scope.add = function (artist) {
            libraryService.add(artist)
                .then(function () {
                    pushArtistToLibrary(artist);
                })
                .catch(function () {
                    // do nothing
                })
        };

        /**
         * Pushes an artist to the library when the add request is sent to the server
         * to allow for instant UI updates.
         */
        function pushArtistToLibrary(artist) {
            // check if artist currently is in library
            var index = $scope.data.map(function (e) {
                return e.spotify_id
            }).indexOf(artist.spotify_id);
            // push if not
            if (index === -1) {
                var a = {
                    name: artist.name,
                    spotify_id: artist.spotify_id,
                    recent_release: {
                        title: 'waiting on info from Spotify...' // placeholder text matching server
                    }
                };
                $scope.data.push(a);
                $scope.gridOptions.data.push(a);
            }

        };

        /**
         * ng-click function fof removing an artist for a user
         */
        $scope.removeArtist = function (artist) {
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
                .catch(function (res) {
                    if (res.data.err === 'Job is currently being processed.') {
                        $scope.syncStatus = 'active';
                        alert('We are unable to cancel your sync library job for the following reason: \n' + res.data.err + ' \n\nWe apologize for any inconvenience this may cause.');
                    } else {
                        console.log(res.data.err);
                    }
                })
        };

        /**
         * Get's a user's library and sets $scope variables based on various sorting keys.
         */
        function getLibrary() {
            libraryService.get()
                .then(function (library) {
                    $scope.data = library;
                    $scope.gridOptions.data = library;
                });
        }

        /**SOCKET IO EVENT LISTENERS**/
        socket.on('sync-status-change', function (status) {
            $scope.syncStatus = status;
            $scope.$apply();
        });

        socket.on('library-added', function (library) {
            $scope.data = library;
            if ($scope.artistName === '') {
                $scope.gridOptions.data = $scope.data;
            }
            $scope.$apply();
        });

        socket.on('artist-details-found', function (artist) {
            // add details to source library
            var index = $scope.data.map(function (e) {
                return e.spotify_id;
            }).indexOf(artist.spotify_id);
            if (index !== -1) {
                $scope.data[index].recent_release = artist.recent_release;
                $scope.$apply();
            }
            // add details to filtered library
            var index = $scope.gridOptions.data.map(function (e) {
                return e.spotify_id;
            }).indexOf(artist.spotify_id);
            if (index !== -1) {
                $scope.gridOptions.data[index].recent_release = artist.recent_release;
                $scope.$apply();
            }
        });


        /********** HELPER FUNCTIONS **********/
        $scope.$watch('data', function() {
            $scope.libraryEmpty = $scope.gridOptions.data <= 0;
        });

        $scope.$watch('gridOptions.data', function(){
            $scope.libraryEmpty = $scope.gridOptions.data <= 0;
        });

        /**
         * Removes an artist from the local library instance, filtered library,
         * and flags potentially cached search results that the artist has been
         * removed.
         * @param {Object} artist
         */
        function removeArtistLoc(artist) {
            // remove from filtered library
            var i = $scope.gridOptions.data.map(function (e) {
                return e.spotify_id
            }).indexOf(artist.spotify_id);
            $scope.gridOptions.data.splice(i, 1);
            // remove from source library
            var j = $scope.data.map(function (e) {
                return e.spotify_id
            }).indexOf(artist.spotify_id);
            $scope.data.splice(j, 1);
            // if we have cached search results
            if ($scope.results){
                var k = $scope.results.map(function(e) {
                    return e.spotify_id
                }).indexOf(artist.spotify_id);
                if (k !== -1){
                    $scope.results[k].artistAdded = false;
                }
            }

        }

        /** JQUERY **/
        // todo convert to a directive?
        // handle clicking outside search results
        $(document).mouseup(function (e) {
            var container = $(".search");
            // if the target of the click isn't the container nor a descendant of the container
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                $scope.resultBoxShown = false;
                $scope.$apply();
            }
        });

        $(document).on('keydown', function(e) {
            if (e.keyCode === 27) {
                $scope.resultBoxShown = false;
                $scope.$apply();
            }
        })
    }]);

