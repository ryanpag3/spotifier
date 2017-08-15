var app = angular.module('spotifier');
app.factory('libraryService', ['$q', '$http',
    function($q, $http) {
        return ({
            sync: sync,
            cancelSync: cancelSync,
            get: get,
            searchSpotify: searchSpotify,
            search: search,
            add: add,
            remove: remove
        });

        // initiates a library sync job for the user
        function sync() {
                var deferred = $q.defer();
                $http.get('/library/sync')
                    .then(function(res) {
                       if (res.status === 200) {
                           deferred.resolve();
                       }
                    });
            return deferred.promise;
        }

        // removes a library sync job from the queue for a user
        function cancelSync() {
            var deferred = $q.defer();
                $http.get('/library/cancel-sync', function(req, res) {
                    if(res.status === 200) {
                        deferred.resolve();
                    } else {
                        deferred.reject('Could not cancel sync job.');
                    }
                });
            return deferred.promise;
        }

        // gets an up to date version of the users library
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
        // gets spotify api artist search results from http request
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
                    deferred.reject(res);
                });
            return deferred.promise;
        }

        // gets user library search results from http request
        function search(query) {
            // todo create ajax call and handle promises
        }

        /**
         * Add an artist to a user's library
         */
        function add(artist) {
            var deferred = $q.defer();
            $http.post('/library/add', {artist: artist})
                .then(function(res) {
                    // todo handle success response
                    deferred.resolve();
                })
                .catch(function(err) {
                    // todo handle error response
                    deferred.reject();
                });
            return deferred.promise;
        }

        /**
         * handle AJAX call and response from server for removing an artist from a user's library
         * @param {Object} artist: artist information to be passed to server
         */
        function remove(artist) {
            var deferred = $q.defer();
            $http.post('/library/remove', {artist: artist})
                .then(function() {
                    deferred.resolve();
                })
                .catch(function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }

    }]);
















