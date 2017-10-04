/**
 * This utility handles creating spotifier playlists for users with new releases.
 */
const Q = require('q');
const User = require('../models/user');
const Db = require('db');
const spotifyUserApi = require('spotify-user-api');

/**
 * Iterates through all users who have new releases found and update playlists.
 * TODO:
 *  - add playlist creation enabled query condition once the settings page has
 *    been created and the schema has updated.
 */
var updateNewReleasePlaylists = function() {
    var deferred = Q.defer();
    // query for all users who have new releases
    User.find({$and: [{'new_releases': {$exists: true, $ne: []}}, 
                      {'refresh_token': {$exists: true}}]}, 'new_releases', 
                        function(users) {
        console.log(users.length);
    });
    // query for all users with new releases and have playlist creation enabled
    // - new releases pending
    // - playlist creation enabled
    // - refresh token in database
    // for each user
    // - call update playlist
}
    

/**
 * FIXME: THIS MIGHT NOT BE NECESSARY
 * Query for user by _id, parse all artist ids in new_release field, check if
 * a user's spotifier playlist exists, clear the user's spotifier playlist,
 * add the release to the user's playlist.
 * @param user mongo doc for user
 */
var updatePlaylist = function(user) {
    // query for all artists by array of artist ids in new release field and select release id
    // if user does not have playlist
    // - create playlist
    // - call add releases to playlist
    // else
    // - call add releases to playlist
}

/**
 * Add all songs of a release to the spotifier playlist
 */
var addReleasesToPlaylist = function(playlistId, releases) {
    // call spotify user api add tracks to playlist
}

/**
 * Clears a user's spotifier playlist
 * @param user mongo document for user
 */
var clearPlaylist = function(user) {

}

// expose top level function
module.exports = {
    updateNewReleasePlaylists: updateNewReleasePlaylists
}