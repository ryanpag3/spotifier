/**
 * This utility handles creating spotifier playlists for users with new releases.
 */

/**
 * Iterates through all users who have new releases found and update playlists.
 */
var updateNewReleasePlaylists = function() {

}

/**
 * Query for user by _id, parse all artist ids in new_release field, check if
 * a user's spotifier playlist exists, clear the user's spotifier playlist,
 * add the release to the user's playlist.
 */
var createOrUpdatePlaylist = function() {

}

/**
 * Add all songs of a release to the spotifier playlist
 */
var addReleaseToPlaylist = function() {

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