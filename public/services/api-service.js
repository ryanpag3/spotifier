var app = angular.module('spotifier');
app.factory('apiService', ['$q', '$http', 'Spotify',
    function($q, $http, Spotify) {
        return ({
            setAuthToken: setAuthToken,
            syncLibrary: syncLibrary
        });

        function setAuthToken(authToken) {
            Spotify.setAuthToken(authToken);
            console.log('access token has been set.');
        }

        /*
            initiates the sync-library queue job
         */
        function syncLibrary() {
                var deferred = $q.defer();
                $http.get('/library/sync', function(req, res) {
                    if (res.status === 200) {
                        deferred.resolve();
                    }
                });
            return deferred.promise;
            }

    }]);