var app = angular.module('spotifier');

app.factory('socket', [function() {
    var socket = io();
    return {
        on: function(eventName, callback) {
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    }
}]);