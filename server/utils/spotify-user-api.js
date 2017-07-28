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
    saveTokens: function (userId, accessToken, refreshToken) {
        users[userId] = {accessToken: accessToken, refreshToken: refreshToken};
    },

    /* sets api tokens */
    setTokens: function (userId) {
        console.log('global access token has been set to: ' + userId);
        spotifyApi.setAccessToken(users[userId].accessToken);
        spotifyApi.setRefreshToken(users[userId].refreshToken);
    },

    /* clears the user tokens */
    clearTokens: function () {
        spotifyApi.resetAccessToken();
        spotifyApi.resetRefreshToken();
    },

    /**
     * Runs a recursive call to the spotify api, grabbing all currently saved tracks.
     * @returns an array of tracks {added_at: (date), track: {}}
     */
    getSavedTracks: function (userId) {
        self.setTokens(userId);
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

        self.clearTokens();
        return deferred.promise;
    },

    /**
     * Iterates through all saved songs in user library, saving the recent album
     * information for every new artist we run into.
     * @returns an array of all saved artists.
     */
    getSavedArtists: function (userId) {
        var savedArtists = {};

        runQuery(50,0);

        function runQuery(limit, offset) {
            self.setTokens(userId);
            // request song
            spotifyApi.getMySavedTracks({
                limit: limit,
                offset: offset
            })
                .then(function(data) {
                    function go(callback) {
                        var i = 0;
                        function add() {
                            // console.log(data.body);
                            var artistId = data.body.items[i].track.artists[0].id;
                            if (savedArtists[artistId] !== undefined) {
                                // do nothing
                            }
                            else {
                                // get most recent album of artist
                                spotifyApi.getArtistAlbums(artistId, ({
                                    limit: 1,
                                    offset: 0
                                }))
                                    .then(function (data) {
                                        var albumId = data.body.items[0].id;
                                        // get album information
                                        spotifyApi.getAlbum(albumId)
                                            .then(function (data) {
                                                var recentRelease = data.body;
                                                // console.log('added artist: ' + recentRelease.artists[0].name + ' | ' + recentRelease.name);
                                                savedArtists[recentRelease.artists[0].id] = {
                                                    name: recentRelease.artists[0].name,
                                                    recentRelease: {
                                                        name: recentRelease.name,
                                                        date: recentRelease.release_date,
                                                        images: recentRelease.images,
                                                        url: recentRelease.external_urls.spotify
                                                    }
                                                };
                                            })
                                    })
                                    .catch(function(err) {
                                        console.log(err);
                                        console.log('USER ID: ' + userId);
                                        console.log('CURRENT ACCESS CODE: ' + spotifyApi.getAccessToken());
                                    })
                            }

                            if (++i < data.body.items.length) {
                                setTimeout(add, 200);
                            } else {
                               callback();
                            }
                        }
                        add();
                    }
                    go(function() {
                        if (offset < data.body.total) {
                            var add = ((data.body.total - offset < 50) ? data.body.total-offset :  50);
                            runQuery(limit, offset += add);
                            console.log(offset + '/' + data.body.total);
                        } else {
                            console.log(savedArtists);
                        }
                    });
                })
                .catch(function(err) {
                    console.log(err);
                    console.log('USER ID: ' + userId);
                    console.log('CURRENT ACCESS CODE: ' + spotifyApi.getAccessToken());
                    // console.log(savedArtists);
                });
            }

        // self.clearTokens();
    },

    getTrackInfo: function (userId, limit, offset, callback) {
        spotifyApi.getMySavedTracks({
            limit: limit,
            offset: offset
        })
            .then(function(data) {
                var artistId = data.body.items[0].track.artists[0].id;
                console.log(artistId);
                self.getMostRecentRelease(userId, artistId, function(albumInfo) {

                });
            })
    },

    /*
        Queries artist albums by artist id, getting the most recent one, then calls getAlbum to get
        more detailed information on that specific album and returns it through a callback.
     */
    getMostRecentRelease: function (userId, artistId, callback) {
        // set user tokens
        self.setTokens(userId);
        // get most recent album or single
        spotifyApi.getArtistAlbums(artistId, ({
            limit: 1,
            offset: 0
        }))
            .then(function (data) {
                // grab id from most recent release from artist
                var albumId = data.body.items[0].id;

                // get detailed album information for callback
                self.getAlbum(userId, albumId, function (albumInfo) {
                    callback(albumInfo);
                });
            });
        self.clearTokens();
    },

    /*
        Takes an albumId and provides the JSON object information through a callback.
     */
    getAlbum: function (userId, albumId, callback) {
        self.setTokens(userId);
        spotifyApi.getAlbum(albumId)
            .then(function (data) {
                callback(data.body);
            });
        self.clearTokens();
    },

    search: function (userId, artistName) {
        self.setTokens(userId);
        var deferred = Q.defer();
        console.log('searching for ' + artistName);
        spotifyApi.searchArtists(artistName)
            .then(function (data) {
                deferred.resolve(data);
            }, function (err) {
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




