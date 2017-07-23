/*
    this will hold the real-time functions of the application
 */

var socket = function(io) {
    io.on('connection', function(socket) {
        console.log('user has connected.');

        socket.on('update-search', function(data) {
            /*
                This will receive the current search field in the user's search bar.
                It will then call the spotify api for the search results for that current
                entry and emit back to the client for updating.
             */
        })
    });
};

module.exports = socket;