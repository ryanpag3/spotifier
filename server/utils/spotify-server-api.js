/** This file handles all the client authenticated calls to the spotify api. **/
var SpotifyApi = require('spotify-web-api-node'),
    Q = require('q'),
    credentials = {
    clientId: '180cc653f1f24ae9864d5d718d68f3c6',
    clientSecret: '7e3b3a161dc6442f974655a3209505cd'
    },
    spotifyApi = new SpotifyApi(credentials); // instantiate api object

var self = module.exports = {

    refreshClientToken: function() {
        var deferred = Q.defer();
        // request new access token
        spotifyApi.clientCredentialsGrant()
            .then(function(data) {
                // apply
                spotifyApi.setAccessToken(data.body.access_token);
                deferred.resolve();
            })
            .catch(function (err) {
                console.log(err);
                deferred.reject(err);
            });
        return deferred.promise;
    },

    getRecentRelease: function (artist) {
        var deferred = Q.defer();
        // ensure fresh token
        self.refreshClientToken()
            .then(function () {
                // retrieve most recent release
                spotifyApi.getArtistAlbums(artist.spotifyId, ({
                    limit: 1,
                    offset: 0
                }))
                    .then(function (data) {
                        self.getAlbumInfo(data.body.items[0].id)
                            .then(function(data) {
                                deferred.resolve(data);
                            })
                            .catch(function(err) {
                                deferred.reject(err);
                            })
                    })
                    .catch(function (err) {
                        deferred.reject('**getArtistAlbums** ' + err);
                    })
            })
            .catch(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    },

    getAlbumInfo: function(albumId) {
        var deferred = Q.defer();
        self.refreshClientToken()
            .then(function() {
                spotifyApi.getAlbum(albumId)
                    .then(function(data) {
                        deferred.resolve(data.body);
                    })
                    .catch(function(err) {
                        deferred.reject(err);
                    })
            })
            .catch(function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    }
};





























