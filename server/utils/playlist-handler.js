/**
 * This utility handles creating spotifier playlists for users with new releases.
 */
const Q = require('q');
const fs = require('fs');
const path = require('path');
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
    var self = this;
    var promises = [];
    var deferred = Q.defer();

    User.find({
            $and: [{ // query filter
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
        },
        function (err, users) {
            if (err) {
                throw new Error(err);
            }
            for (var i = 0; i < users.length; i++) {
                promises.push(updatePlaylist(users[i]));
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
 * check if user has turned on playlist creation
 * @param user mongo doc for user
 */
function updatePlaylist(user) {
    var deferred = Q.defer();
    // does a playlist exist for the user?
    // has it been over a week since the last reset? AND 
    // are we one week later than the last global reset?
    // if true
    // reset playlist
    // else
    // add songs

    playlistExists(user)
        .then(function (exists) {
            if (!exists) {
                return createPlaylist(user);
            }
            return;
        })
        .then(function () {
            // is current date later than reset date?
            return playlistResetNeeded(user);
        })
        .then(function (reset) {
            console.log(reset);
            // if reset, empty playlist
        })
        .then(function () {
            // add releases
        })
        .catch(function (err) {
            deferred.reject(err);
        })

    return deferred.promise;
}

/**
 * Calls user api module to determine whether a valid spotify api exists.
 * @param {JSON} user mongodb user document
 * @returns {Promise<Boolean>} promise object with boolean value 
 */
function playlistExists(user) {
    var deferred = Q.defer();
    var api = new SpotifyUserApi();
    api.playlistExists(user)
        .then(function(exists) {
            deferred.resolve(exists);
        })
        .catch(function(err) {
            deferred.reject(err);
        });
    return deferred.promise;
}

/**
 * We we into the next playlist week? Playlists reset on 11:59AM Saturday evening.
 * @returns {Boolean} new playlist week?
 */
function playlistResetNeeded(user) {
    /**
     * HAS IT BEEN OVER A WEEK SINCE THE USER'S LAST RESET
     * AND IS IT PAST THE DATE OF THE LAST GLOBAL RESET?
     */
    var deferred = Q.defer();
    var lastReset = user.playlist.last_reset;
    if (!lastReset) { // if first reset, serialize date and skip for user
        var current = new Date();
        console.log(current);
        // serializeUserResetDate(user, current);
    }
    return deferred.promise;
}

/**
 * Serialize the last playlist date into database for user
 * @param {JSON} user mongodb user document
 * @param {string} newDate new date value to be serialized
 */
function serializeUserResetDate(user, newDate) {
    var deferred = Q.defer();
    User.update({'_id' : user._id}, {'last_reset': newDate}, function(err) {
        if (err) {
            deferred.reject(err);
        }
        deferred.resolve();
    })
    return deferred.promise;
}

/**
 * Retrieve the playlist date from the settings file
 * @returns {string} date string 
 */
function getPlaylistResetDate() {
    const file = 'playlist-reset-date.json';
    const filePath = path.join(__dirname + '/utils-resources/', file);
    var fileData = fs.readFileSync(filePath, 'utf-8');
    fileData = JSON.parse(fileData);
    return fileData.last_reset;
}

/**
 * Write new playlist date to the settings file
 */
function saveNewPlaylistResetDate() {
    const file = 'playlist-reset-date.json';
    const filePath = path.join(__direname + '/utils-resources/', file);
    var deferred = Q.defer();
    var currentDate = new Date();
    var fileContents = {
        "last_reset" : currentDate
    }
    JSON.stringify(fileContents, null, 4);
    fs.writeFile(filePath, fileContents, 'utf-8', function(err) {
        if (err) {
            deferred.reject(err);
        }
        deferred.resolve();
    });
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