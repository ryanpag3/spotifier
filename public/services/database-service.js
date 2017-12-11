var app = angular.module('spotifier');
app.factory('dbService', ['$http', '$q',
    function($http, $q) {
        return ({
           getLibrary: getLibrary,
           updatePlaylistSetting: updatePlaylistSetting,
           getPlaylistSetting: getPlaylistSetting
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

        function getPlaylistSetting(userId) {
            var deferred = $q.defer();
            $http.get('user/setting/playlist')
                .then(function(res) {
                    if (res.status === 200) {
                        deferred.resolve(res.data.playlistEnabled);
                    }
                });
            return deferred.promise;
        }

        function updatePlaylistSetting(mEnabled) {
            var deferred = $q.defer();
            $http.post('user/setting/playlist-update', ({playlistEnabled: mEnabled}))
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
    }]);