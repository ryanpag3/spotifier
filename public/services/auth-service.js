/**
 * Created by ryan on 7/19/2017.
 */
var app = angular.module('spotifier');
app.factory('authServ', ['$q', '$http',
    function($q, $http) {
        return ({
            isAuthenticated: isAuthenticated,
            submitEmail: submitEmail
        });

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

        /**
         * Handles AJAX and passes email address to API endpoint
         * @param emailAddress
         */
        function submitEmail(emailAddress) {
            var deferred = $q.defer();
            console.log('we here...');

            $http.post('/user/email/add', {emailAddress: emailAddress});
        //         .then(function(res) {
        //             // todo
        //         })
        //         .catch(function(err) {
        //             // todo
        //         })
        }
    }]);