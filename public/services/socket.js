/*
    This service wraps the socket.io commands so they can be used in angular's scope.
 */

var app = angular.module('spotifier');
app.factory('socket', ['$rootScope', function($rootScope) {
    // instantiate client-side socket.io
    var socket = io();

    // wrapper
    return {
        on: function(eventName, callback) {
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    }
}]);