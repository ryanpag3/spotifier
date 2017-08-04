/**
 * Created by ryan on 7/19/2017.
 */
var app = angular.module('spotifier');
app.factory('authServ', ['$q', '$http',
    function($q, $http) {
        return ({
            getUser: getUser,
            isAuthenticated: isAuthenticated
        });

        function getUser() {
            var deferred = $q.defer();
            $http.get('/user/me')
                .then(function(res) {
                    deferred.resolve(res.data);
                })
                .catch(function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }

        function isAuthenticated() {
            var deferred = $q.defer();

            $http.get('/user/status')
                .then(function(res) {
                    deferred.resolve(res.data);
                })
                .catch(function(err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        }
    }]);