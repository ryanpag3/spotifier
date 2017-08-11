/**
 * Created by ryan on 7/19/2017.
 */
var app = angular.module('spotifier');
app.factory('authServ', ['$q', '$http', '$location',
    function($q, $http, $location) {
        return ({
            isAuthenticated: isAuthenticated,
            submitEmail: submitEmail,
            sendConfirmationEmail: sendConfirmationEmail
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
            $http.post('/user/email/add', {emailAddress: emailAddress})
                .then(function(res) {
                   sendConfirmationEmail();
                })
                .catch(function(err) {
                    console.log(err);
                })
        }

        function sendConfirmationEmail() {
            $http.get('/user/email/send-confirmation')
                .then(function() {
                    $location.path('/confirm-pending');
                })
                .catch(function(err) {
                    console.log(err);
                })
        }
    }]);