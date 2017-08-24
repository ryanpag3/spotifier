/**
 * Created by ryan on 7/19/2017.
 */
var app = angular.module('spotifier');
app.factory('authService', ['$q', '$http', '$location',
    function ($q, $http, $location) {
        return ({
            serializeSessionUser: serializeSessionUser,
            getStatus: getStatus,
            getEmailStatus: getEmailStatus,
            submitEmail: submitEmail,
            sendConfirmationEmail: sendConfirmationEmail
        });

        /**
         * serialize the user into HTML5 session storage.
         * @returns {Q.Promise<T>}
         */
        function serializeSessionUser() {
            var deferred = $q.defer();
            $http.get('/user/get')
                .then(function (res) {
                    sessionStorage.setItem('user', JSON.stringify(res.data.user));
                    deferred.resolve();
                })
                .catch(function (res) {
                    deferred.reject(res.data.err);
                });
            return deferred.promise;
        }

        /**
         * handles AJAX call and response to determine user authentication status
         * @returns {Q.Promise<Boolean>}
         */
        function getStatus() {
            var deferred = $q.defer();
            $http.get('/user/status')
                .then(function (res) {
                    deferred.resolve(res.data.isAuthenticated);
                })
                .catch(function (res) {
                    deferred.reject(res.data.err);
                });
            return deferred.promise;
        }

        function getEmailStatus() {
            var deferred = $q.defer();
            $http.get('/user/email/status')
                .then(function (res) {
                    deferred.resolve(res.data.isConfirmed);
                })
                .catch(function (res) {
                    console.log(res);
                    deferred.resolve(res.data.err);
                });
            return deferred.promise;
        }

        /**
         * Handles AJAX and passes email address to API endpoint
         * @param emailAddress
         */
        function submitEmail(emailAddress) {
            $http.post('/user/email/add', {emailAddress: emailAddress})
                .then(function (res) {
                    sendConfirmationEmail();
                })
                .catch(function (err) {
                    console.log(err);
                })
        }

        function sendConfirmationEmail() {
            $http.get('/user/email/send-confirmation')
                .then(function () {
                    $location.path('/confirm-pending');
                })
                .catch(function (err) {
                    console.log(err);
                })
        }
    }]);