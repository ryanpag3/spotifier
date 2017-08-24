var User = require('../models/user'),
    Artist = require('../models/artist');

function Socket(io) {
    var self = this;
    self.users = {}; // hash-map user id bound to socket
    self.io = io; // local reference to io object
    // listener
    self.io.on('connection', function (socket) {
        socket.on('add-user', function (user) {
            self.users[user._id] = socket;
        })
    });
}

/**
 * Emits to a user when their sync library status has changed and passes the new sync status
 * for client updating.
 * @param user
 * @param status
 */
Socket.prototype.alertSyncQueueStatusChange = function (user, status) {
    this.users[user._id].emit('sync-status-change', status);

};

Socket.prototype.alertLibraryAdded = function (user, library) {
    this.users[user._id].emit('library-added', library);
};

/**
 * alerts all clients online who are tracking an artist that their details have updated
 * @param artist
 */
Socket.prototype.alertArtistDetailsChange = function (artist) {
    var self = this;
    var _ids = Object.keys(this.users);
    Artist.findOne({'spotify_id': artist.spotify_id}, 'users_tracking', function (err, qArtist) {
        if (err) {
            console.log(err);
        }
        if (artist) {
            for (var i = 0; i < qArtist.users_tracking.length; i++) {
                if (_ids.indexOf(qArtist.users_tracking[i].toString()) !== -1) {
                    self.users[qArtist.users_tracking[i]].emit('artist-details-found', artist);
                }
            }
        }
    })
};

module.exports = Socket;

