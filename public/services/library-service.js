var app = angular.module('spotifier');
app.factory('libraryService', ['$q', '$http',
    function ($q, $http) {
        return ({
            sync: sync,
            cancelSync: cancelSync,
            get: get,
            searchSpotify: searchSpotify,
            search: search,
            add: add,
            remove: remove,
            getSyncStatus: getSyncStatus
        });

        // initiates a library sync job for the user
        function sync() {
            var deferred = $q.defer();
            $http.get('/library/sync')
                .then(function (res) {
                    if (res.status === 200) {
                        deferred.resolve();
                    }
                });
            return deferred.promise;
        }

        // removes a library sync job from the queue for a user
        function cancelSync() {
            var deferred = $q.defer();
            $http.get('/library/cancel-sync')
                .then(function (res) {
                    if (res.status === 200) {
                        deferred.resolve();
                    }
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }

        // gets an up to date version of the users library
        function get () {
            var deferred = $q.defer();
            $http.get('library/update')
                .then(function (res) {
                    if (res.status === 200) {
                        deferred.resolve(res.data.library);
                    }
                });
            return deferred.promise;
        }

        function getSyncStatus() {
            var deferred = $q.defer();
            $http.get('/library/sync-status')
                .then(function(res) {
                    if(res.status === 200) {
                        deferred.resolve(res.data.status)
                    }
                })
                .catch(function(err) {
                   deferred.reject(err);
                });
            return deferred.promise;
        }

        // gets spotify api artist search results from http request
        function searchSpotify(query) {
            var deferred = $q.defer();
            $http.post('/artist/search', ({query: query}))
                .then(function (res) {
                    if (res.status === 200) {
                        deferred.resolve(res.data.result);
                    } else {
                        deferred.reject();
                    }
                })
                .catch(function (res) {
                    deferred.reject(res);
                });
            return deferred.promise;
        }

        /**
         * Add an artist to a user's library
         */
        function add(artist) {
            var deferred = $q.defer();
            $http.post('/library/add', {artist: artist})
                .then(function (res) {
                    deferred.resolve();
                })
                .catch(function (err) {
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
                .then(function () {
                    deferred.resolve();
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }

    }]);
















