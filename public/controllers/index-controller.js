var app = angular.module('spotifier');
app.controller('index-controller', ['$scope', '$rootScope', 'libraryService',
    function ($scope, $rootScope, libraryService) {
        var prevQuery;
        $scope.results = null;
        $scope.resultsShown = false;

        /**
         * caller method for search form
         * parses the query to eliminate unnecessary white space. If the query matches the previous
         * query and it is not empty, shows cached results. If the query is not the same as the
         * previous and not empty, calls the libraryService search function which handles the AJAX
         * call to the API.
         **/
        $scope.search = function (query) {
            // trim query
            var mQuery = query.trim();
            // if not same as previous and not empty
            if (mQuery === prevQuery && mQuery !== '') {
                // display previous results
                $scope.resultsShown = true;
            }
            // if not empty
            else if (mQuery !== '') {
                libraryService.searchSpotify(mQuery)
                    .then(function (res) {
                        prevQuery = mQuery;
                        $scope.results = res;
                        $scope.resultsShown = true;
                        console.log($scope.results);
                        console.log($scope.resultsShown);
                    })
                    .catch(function (err) {

                    });
                $(function () {
                    $('#spotify-search').blur();
                })
            }
        };

        $scope.add = function (artist) {
            libraryService.add(artist)
                .then(function () {
                    // todo handle service response
                })
                .catch(function () {
                    // todo handle service error response
                })
        };


        /** JQUERY **/

        // handle clicking outside search results
        $(document).mouseup(function (e) {
            var container = $(".search");
            // if the target of the click isn't the container nor a descendant of the container
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                $scope.resultsShown = false;
                $scope.$apply();
            }
        });

    }]);