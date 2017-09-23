/**
 * This utility handles creating spotifier playlists for users with new releases.
 */

 const Db = require('db');
 const spotifyUserApi = require('spotify-user-api');

/**
 * Iterates through all users who have new releases found and update playlists.
 */
var updateNewReleasePlaylists = function() {
    // query for all users with new releases and have playlist creation enabled
    // - new releases pending
    // - playlist creation enabled
    // - refresh token in database
    // for each user
    // - call create and update playlist
}
    

/**
 * Query for user by _id, parse all artist ids in new_release field, check if
 * a user's spotifier playlist exists, clear the user's spotifier playlist,
 * add the release to the user's playlist.
 */
var createAndUpdatePlaylist = function(user) {
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
var addReleasesToPlaylist = function(user) {

}

/**
 * Clears a user's spotifier playlist
 */
var clearPlaylist = function() {

}

// expose top level function
module.exports = {
    updateNewReleasePlaylists: updateNewReleasePlaylists
}