/** This file handles all of the user authenticated api calls to Spotify **/
var SpotifyApi = require('spotify-web-api-node'),
    Q = require('q'),
    userDb = require('../utils/db-user-wrapper.js'),
    credentials = {
        clientId: '180cc653f1f24ae9864d5d718d68f3c6',
        clientSecret: '7e3b3a161dc6442f974655a3209505cd'
    };


var self = module.exports = {

    /**
     * Our authentication strategy does not handle expiration times for tokens automatically, so we
     * check and see if we have already set an expiration date in milliseconds, or if the expiration
     * time has passed. If the token is still valid, we do not call the spotify api.
     * @param refreshToken
     */
    getAccessToken: function(user) {
        var deferred = Q.defer();
        var currentDate = new Date().getTime(); // in millis
        // our authentication strategy does not handle expiration times for tokens automatically
        // so we check and see if we have handled it, or if the expiration time has passed
        // if the token is still valid, we do not waste api requests
        if (user.accessToken.expireDate === undefined || user.accessToken.expireDate < currentDate) {
            var spotifyApi = new SpotifyApi(credentials);
            spotifyApi.setRefreshToken(user.refreshToken);
            spotifyApi.refreshAccessToken()
                .then(function (data) {
                    deferred.resolve({
                        token: data.body.access_token,
                        // convert expiration time to millis and subtract a minute to allow a buffer
                        expireDate: currentDate + (data.body.expires_in * 1000) - 60000
                    })
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
        }
        return deferred.promise;
    },

    /** grab all unique artists that a user has on their saved songs **/
    getLibraryArtists: function(user) {
        var spotifyApi = new SpotifyApi(credentials),
            limit = 50,
            offset = 0,
            artists = [],
            artistAdded = {},
            deferred = Q.defer();

        self.getAccessToken(user)
            .then(function(accessToken) {
                user.accessToken = accessToken;
                spotifyApi.setAccessToken(user.accessToken.token);
                console.log('grabbing artists for ' + user.id);
                function go() {
                    spotifyApi.getMySavedTracks({
                        limit: limit,
                        offset: offset
                    })
                        .then(function(data) {
                            for (var i = 0; i < data.body.items.length; i++) {
                                var track = data.body.items[i].track;
                                // grab primary artist id, ignore features
                                var artistId = track.artists[0].id;
                                if (artistAdded[artistId] === undefined && track.preview_url !== null) {
                                    var artistName = track.artists[0].name;
                                    artistAdded[artistId] = true;
                                    artists.push({artistId: artistId, artistName: artistName});
                                }
                            }
                            offset += ((data.body.total - offset < limit) ? data.body.total - offset : limit);
                            if (offset < data.body.total - 1) {
                                go();
                            } else {
                                console.log('artists successfully grabbed...');
                                deferred.resolve(artists);
                            }
                        })
                        .catch(function(err) {
                            console.log(offset);
                            console.log(err);
                            deferred.reject();
                        });
                }
                go(limit, offset);
            })
            .catch(function(err) {
                console.log(err);
            });
        return deferred.promise;
   }
};