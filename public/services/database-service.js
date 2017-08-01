var app = angular.module('spotifier');
app.factory('dbService', ['$http', '$q',
    function($http, $q) {
        return ({
           getLibrary: getLibrary
        });

        function getLibrary() {
            var deferred = $q.defer();
            $http.get('library/update')
                .then(function(res) {
                    if (res.status === 200) {
                        deferred.resolve(res.data.library);
                    }
                });
            return deferred.promise;
        }
    }]);