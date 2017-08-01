var app = angular.module('spotifier');
app.controller('index-controller', ['$scope', '$rootScope', 'libraryService',
    function($scope, $rootScope, libraryService) {
        var prevQuery;
        $scope.results = null;
        $scope.search = function(query) {
            var mQuery = query.trim();
            if (mQuery === prevQuery) {
                // display previous results
            }
            else if (mQuery !== ''){
                libraryService.searchSpotify(mQuery)
                    .then(function(res) {
                         prevQuery = mQuery;
                        $scope.results = res;
                        console.log($scope.results);
                    })
                    .catch(function(err) {

                    });
                $(function() {
                    $('#spotify-search').blur();
                })
            }


        }
}]);