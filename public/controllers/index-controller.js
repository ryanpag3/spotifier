var app = angular.module('spotifier');
app.controller('index-controller', ['$scope', '$rootScope', 'libraryService',
    function($scope, $rootScope, libraryService) {
        var prevQuery;
        $scope.results = null;
        $scope.resultsShown = false;
        $scope.search = function(query) {
            var mQuery = query.trim();
            if (mQuery === prevQuery && mQuery !== '') {
                // display previous results
                $scope.resultsShown = true;

            }
            else if (mQuery !== ''){
                libraryService.searchSpotify(mQuery)
                    .then(function(res) {
                         prevQuery = mQuery;
                        $scope.results = res;
                        $scope.resultsShown = true;
                        console.log($scope.results);
                        console.log($scope.resultsShown);
                    })
                    .catch(function(err) {

                    });
                $(function() {
                    $('#spotify-search').blur();
                })
            }
        };

        /** JQUERY **/

        // handle clicking outside search results
        $(document).mouseup(function(e) {
            var container = $(".search");

            // if the target of the click isn't the container nor a descendant of the container
            if (!container.is(e.target) && container.has(e.target).length === 0)
            {
                $scope.resultsShown = false;
                $scope.$apply();
            }
        });

}]);