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
    getSavedArtists: function (userId, callback) {
        var savedArtists = {};

        // start recursive function
        runQuery(0, 50);

        function runQuery(offset, limit) {
            self.setTokens(userId);
            spotifyApi.getMySavedTracks({
                limit: limit,
                offset: offset
            })
                .then(function (data) {
                    var length = data.body.items.length;
                    var trackList = data.body;
                    // iterate through each track in query block
                    for (var i = 0; i < length; i++) {
                        (function(i){
                            setTimeout(function() {
                                var track = trackList.items[i].track;
                                // iterate through each artist in each song
                                // songs can have multiple contributing artists, we save all by default
                                for (var j = 0; j < track.artists.length; j++) {
                                    var artist = track.artists[j];
                                    // if artist has not been saved yet
                                    if (savedArtists[artist.id] === undefined) {
                                        // get most recent release and save to savedArtists
                                        self.getMostRecentRelease(userId, artist.id,
                                            function (data) {
                                                var recentRelease = data;
                                                console.log('added artist: ' + recentRelease.artists[0].name + ' | ' + recentRelease.name);
                                                savedArtists[recentRelease.artists[0].id] = {
                                                    name: recentRelease.artists[0].name,
                                                    recentRelease: {
                                                        name: recentRelease.name,
                                                        date: recentRelease.release_date,
                                                        images: recentRelease.images,
                                                        url: recentRelease.external_urls.spotify
                                                    }
                                                };
                                            });
                                    }
                                }
                            }, 500);
                        })(i);
                    }
                    // // check if callback thrown
                    // if (length > 0) {
                    //     runQuery(offset += limit, limit);
                    //     console.log('length of savedArtists: ' + Object.keys(savedArtists).length);
                    // } else {
                    //     console.log('THIS SHOULD COME LAST');
                    //     callback(savedArtists);
                    //     self.clearTokens();
                    // }
                });
        }
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




