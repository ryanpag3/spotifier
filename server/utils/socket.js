function Socket(io) {
    this.users = {}; // hash-map user id bound to socket
    this.io = io;
    this.io.on('connection', function(socket) {
        console.log('a user has connected');
    })
}

module.exports = Socket;

