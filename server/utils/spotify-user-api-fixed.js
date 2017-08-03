var SpotifyApi = require('spotify-web-api-node'),
    Q = require('q'),
    credentials = {
        clientId: '180cc653f1f24ae9864d5d718d68f3c6',
        clientSecret: '7e3b3a161dc6442f974655a3209505cd'
    };

// constructor
var Api = function() {
  this.spotifyApi = new SpotifyApi(credentials);
};

/** METHODS **/

/**
 * The authentication strategy does not handle expiration times for tokens automatically, so we check and see if
 * we have already set an expiration date in milliseconds, or if the expiration time has passed. If the token is
 * still valid, we do not need to call Spotify's api for a new one.
 * @param user
 */
Api.prototype.getAccessToken = function(user) {
    // TODO
    // we might be able to integrate this into the constructor
};

/**
 * Requests user's saved tracks in blocks of 50, iterates through and saves each new artist it runs into. Repeats until
 * all of the user's saved tracks have been processed.
 * @param user
 */
Api.prototype.getLibraryArtists = function(user) {
    // TODO
};

/**
 * queries the spotify api for an artist and returns the results
 * @param user
 * @param query
 */
Api.prototype.searchArtists = function(user, query) {
    // TODO
};

module.exports = Api;

