var app = angular.module('spotifier');
app.factory('libraryService', ['$q', '$http', 'Spotify',
    function($q, $http, Spotify) {
        return ({
            sync: sync,
            get: get,
            searchSpotify: searchSpotify,
            search: search
        });

        /* initiates the sync-library queue job */
        function sync() {
                var deferred = $q.defer();
                $http.get('/library/sync', function(req, res) {
                    if (res.status === 200) {
                        deferred.resolve();
                    }
                });
            return deferred.promise;
        }

        function get() {
            var deferred = $q.defer();
            $http.get('library/update')
                .then(function(res) {
                    if (res.status === 200) {
                        deferred.resolve(res.data.library);
                    }
                });
            return deferred.promise;
        }

        function searchSpotify(query) {
            var deferred = $q.defer();
            console.log(query);
            $http.post('/artist/search', ({ query: query }))
                .then(function(res) {
                    if (res.status === 200){
                        deferred.resolve(res.data.result);
                    } else {
                        deferred.reject();
                    }
                })
                .catch(function(res) {
                    deferred.reject(res.data.err);
                });
            return deferred.promise;
        }

        function search(query) {
            // todo
        }

    }]);