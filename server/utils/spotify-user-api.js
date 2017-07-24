var SpotifyApi = require('spotify-web-api-node');
var Q = require('q');
var credentials = {
    clientID: '180cc653f1f24ae9864d5d718d68f3c6',
    clientSecret: '7e3b3a161dc6442f974655a3209505cd',
    redirectUri: 'http://localhost:3000/user/callback'
};
var spotifyApi = new SpotifyApi(credentials);
var users = {};

var self = module.exports = {

    /* saves user tokens to map */
    saveTokens: function(userId, accessToken, refreshToken) {
        users[userId] = {accessToken: accessToken, refreshToken: refreshToken};
    },

    /* sets api tokens */
    setTokens: function (userId) {
        spotifyApi.setAccessToken(users[userId].accessToken);
        spotifyApi.setRefreshToken(users[userId].refreshToken);
    },

    /* clears the user tokens */
    clearTokens: function() {
        spotifyApi.resetAccessToken();
        spotifyApi.resetRefreshToken();
    },

    /**
     * Runs a recursive call to the spotify api, grabbing all currently saved tracks.
     * @returns an array of tracks {added_at: (date), track: {}}
     */
    getSavedTracks: function (userId) {
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
                        deferred.resolve(savedTracks);
                    }
                }, function (err) {
                    console.log('Something went wrong', err);
                });
        }

        return deferred.promise;
    },

    /**
     * Iterates through all followed songs
     * @returns an array of all saved artists.
     */
    getSavedArtists: function(userId) {
        self.setTokens(userId);
        var savedArtists = {},
            deferred = Q.defer();
        // todo
        // get all saved songs
        spotifyApi.getMySavedAlbums({
            limit: 50,
            offset: 0
        })
            .then(function (data) {
                for (var i = 0; i < data.body.items.length; i++) {
                    // get artists array from each album
                    var artists = data.body.items[i].album.artists;
                    // iterate through artists array
                    for (var j = 0; j < artists.length; j++){
                        if (savedArtists[artists[j].id] === undefined) {
                            console.log('NAME ' + artists[j].name);
                            self.getMostRecentRelease(userId, artists[j].id, function(data) {
                                var recentRelease = data;
                                savedArtists[recentRelease.artists[0].id] = {
                                    name: recentRelease.artists[0].name,
                                    recentRelease: {
                                        name: recentRelease.name,
                                        date: recentRelease.release_date,
                                        images: recentRelease.images,
                                        url: recentRelease.external_urls.spotify
                                    }
                                };
                                console.log(savedArtists[recentRelease.artists[0].id]);
                            });
                        }
                    }
                }
            });
        self.clearTokens();
    },

    getMostRecentRelease: function(userId, artistId, callback) {
        // set user tokens
        self.setTokens(userId);
        // get most recent album or single
        spotifyApi.getArtistAlbums(artistId, ({
            limit: 1,
            offset: 0
        }))
            .then(function(data) {
                // grab id from most recent release from artist
                console.log(data.body.items[0]);
                var albumId = data.body.items[0].id;

                // get detailed album information for callback
                self.getAlbum(userId, albumId, function(albumInfo) {
                    callback(albumInfo);
                });
            });
        self.clearTokens();
    },

    getAlbum: function(userId, albumId, callback) {
        self.setTokens(userId);
        spotifyApi.getAlbum(albumId)
            .then(function(data) {
               callback(data.body);
            });
        self.clearTokens();
    },

    search: function(userId, artistName) {
        self.setTokens(userId);
        var deferred = Q.defer();
        console.log('searching for ' + artistName);
        spotifyApi.searchArtists(artistName)
            .then(function(data) {
                deferred.resolve(data);
            }, function(err) {
                deferred.reject(err);
            });
        self.clearTokens();
        return deferred.promise;
    }
};

    // TODO
    // create wrapper functions for handling importing users saved tracks
    // setup database schema for handling checking artists
    // create a application client ID authorization flow for handling checking db
    // for new releases




