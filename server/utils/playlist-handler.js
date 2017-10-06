/**
 * This utility handles creating spotifier playlists for users with new releases.
 */
const Q = require('q');
const User = require('../models/user');
const Db = require('../utils/db');
const SpotifyUserApi = require('./spotify-user-api');

/**
 * Iterates through all users who have new releases found and update playlists.
 * TODO:
 *  - add playlist creation enabled query condition once the settings page has
 *    been created and the schema has updated.
 */
var updateNewReleasePlaylists = function () {
    // query for all users with new releases and have playlist creation enabled
    // - new releases pending
    // - playlist creation enabled
    // - refresh token in database
    // for each user
    // - call update playlist
    var self = this;
    var promises = [];
    var deferred = Q.defer();

    // query for all users who have new releases
    User.find({
            $and: [{
                    'new_releases': {
                        $exists: true,
                        $ne: []
                    }
                },
                {
                    'refresh_token': {
                        $exists: true
                    }
                }
            ]
        }, 'new_releases',
        function (err, users) {
            if (err) {
                throw new Error(err);
            }
            for (var i = 0; i < users.length; i++) {
                promises.push(updatePlaylist(users[i]._id));
            }
            deferred.resolve(Q.allSettled(promises));
        });
    return deferred.promise;
}


/**
 * Query for user by _id, parse all artist ids in new_release field, check if
 * a user's spotifier playlist exists, clear the user's spotifier playlist,
 * add the release to the user's playlist.
 * TODO: 
 * @param user mongo doc for user
 */
function updatePlaylist(userId) {
    // query for all artists by array of artist ids in new release field and select release id
    // if user does not have playlist
    // - create playlist
    // - call add releases to playlist
    // else
    // - call add releases to playlist
    var deferred = Q.defer();
    // deferred.resolve();
    playlistExists(userId)
        .then(function (exists) {
            if (!exists) {
                return createPlaylist(userId);
            }
            return;
        })
        // TODO: refactor to add releases to playlist
        .then(function () {
            console.log('final');
            deferred.resolve();
        })

    return deferred.promise;

}

// TODO: document
// this needs to be refactored
// check if playlistExists on spotify as well
function playlistExists(userId) {
    var deferred = Q.defer();
    User.findOne({
        '_id': userId
    }, function (err, user) {
        if (err) { // TODO: decide how to handle err thrown
            console.log(err);
            deferred.reject(err);
        }
        if (user.playlist_id) { // TODO: check if this is enough to check for id
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }
    })
    return deferred.promise;
}



// TODO: save playlist ID to document
function createPlaylist(userId) {
    var deferred = Q.defer();
    var spotifyUserApi = new SpotifyUserApi();
    // test async task
    User.findOne({
        '_id': userId
    }, function (err, user) {
        spotifyUserApi.createPlaylist(user)
            .then(function (playlistInfo) {
                console.log(playlistInfo);
                deferred.resolve();
            })
    })
    return deferred.promise;
}

/**
 * Clears a user's spotifier playlist
 * @param user mongo document for user
 */
function clearPlaylist(user) {

}


/**
 * Add all songs of a release to the spotifier playlist
 */
function addReleasesToPlaylist(playlistId, releases) {
    // call spotify user api add tracks to playlist
}





// expose top level function
module.exports = {
    updateNewReleasePlaylists: updateNewReleasePlaylists
}