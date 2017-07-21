var SpotifyApi = require('spotify-web-api-node');
var Q = require('q');
var credentials = {
    clientID: '180cc653f1f24ae9864d5d718d68f3c6',
    clientSecret: '7e3b3a161dc6442f974655a3209505cd',
    redirectUri: 'http://localhost:3000/user/callback'
};
var spotifyApi = new SpotifyApi(credentials);

var self = module.exports = {
    // takes the access and refresh token provided by passport-spotify and applies it
    setTokens: function (accessToken, refreshToken) {
        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);
    },

    /**
     * Runs a recursive call to the spotify api, grabbing all currently saved tracks.
     * @returns an array of tracks {added_at: (date), track: {}}
     */
    getSavedTracks: function () {
        var savedTracks = [],
            limit = 50;
        var deferred = Q.defer();
        // start recursive call setting offset to initial position
        runQuery(0);

        function runQuery(offset) {
            spotifyApi.getMySavedTracks({
                limit: limit,
                offset: offset
            })
                .then(function (data) {
                    savedTracks = savedTracks.concat(data.body.items);
                    // recursive call until api returns 0
                    if (data.body.items.length > 0) {
                        runQuery(offset += limit);
                    } else {
                        done();
                    }
                }, function (err) {
                    console.log('Something went wrong', err);
                });
        }

        /**
         * resolves the promise for returning
         */
        function done() {
            for (var i = 0; i < savedTracks.length; i++) {
                deferred.resolve(savedTracks);
            }
        }

        return deferred.promise;
    },

    /**
     * Iterates through all followed songs
     * @returns an array of all saved artists.
     */
    getArtists: function() {

    }
};

    // TODO
    // create wrapper functions for handling importing users saved tracks
    // setup database schema for handling checking artists
    // create a application client ID authorization flow for handling checking db
    // for new releases




