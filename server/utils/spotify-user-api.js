var SpotifyApi = require('spotify-web-api-node'),
    spotifyServerApi = require('./spotify-server-api'),
    Q = require('q'),
    request = require('request-promise'),
    Db = require('./db.js'),
    logger = require('./logger'),
    Artist = require('../models/artist'),
    configPrivate = require('../../private/config-private'),
    configPublic = require('../../config-public'),
    credentials = {
        clientId: configPrivate.spotify.clientId,
        clientSecret: configPrivate.spotify.clientSecret
    };

// constructor
function Api() {
    this.spotifyApi = new SpotifyApi(credentials);
    this.artists = [];
    this.artistAdded = {};
    this.offset = 0;
    this.total = 0;
    this.searchResults = [];
}

/** METHODS **/

/**
 * Refreshes a user's access token if necessary, then retrieves all the unique
 * artists of a user's saved songs library, then adds them to the database.
 * @param user: req.user object containing id info
 * @param socketUtil: need to pass this object into the artist details queue, which can
 * only happen through this entry point.
 * @returns {Q.Promise<T>}
 */
Api.prototype.syncLibrary = function (user, socketUtil) {
    logger.info('attempting to sync ' + user.name + '\'s library.');
    var api = this,
        deferred = Q.defer();
    api.getAccessToken(user)
        .then((accessToken) => {
            if (accessToken) {
                user.accessToken = accessToken.token;
            }
            return this.spotifyApi.setAccessToken(user.accessToken);
        })
        .then(() => api.getLibraryArtists(user)
        .then(function (artists) {
            var db = new Db();
            logger.info(user.name + '\'s library is being added with artist array length: ' + artists.length);
            db.addAllArtists(user, artists, socketUtil)
                .then(function () {
                    db.getLibrary(user)
                        .then(function (library) {
                            socketUtil.alertLibraryAdded(user, library);
                        });
                    deferred.resolve();
                });
        })
        .catch(function (err) {
            logger.error(err);
            deferred.reject(err);
        }));
    return deferred.promise;
};

/**
 * The authentication strategy does not handle expiration times for tokens automatically, so we check and see if
 * we have already set an expiration date in milliseconds, or if the expiration time has passed. If the token is
 * still valid, we do not need to call Spotify's api for a new one.
 * @param user: req.user cookie object
 * @returns: {Promise}
 */
Api.prototype.getAccessToken = function (user) {
    var api = this.spotifyApi,
        deferred = Q.defer(),
        currentDate = new Date().getTime(); // in millis
    // if we havent set the expireDate or if the currentDate is past the expireDate
    if (!user.accessToken || user.accessToken.expireDate < currentDate) {
        api.setRefreshToken(user.refresh_token);
        // refresh token
        api.refreshAccessToken()
            .then(function (data) {
                // assign access token
                // api.setAccessToken(data.body.access_token);
                // return new token
                deferred.resolve({
                    token: data.body.access_token,
                    expireDate: currentDate + (data.body.expires_in * 1000) - 60000
                });
            })
            .catch(function (err) {
                deferred.reject(err);
            })
    } else {
        // token doesn't need to be refreshed, return
        deferred.resolve();
    }
    return deferred.promise;
};

/**
 * If the user parameter is not null, we set the api object to user this user's access token.
 * @param user: req.user object
 * @returns {Promise}
 */
Api.prototype.setAccessToken = function (user) {
    var deferred = Q.defer();
    if (user) {
        if (!user.accessToken.token) {
            this.spotifyApi.setAccessToken(user.accessToken);
        } else {
            this.spotifyApi.setAccessToken(user.accessToken.token);
        }
        deferred.resolve();
    } else {
        deferred.reject('user does not exist.');
    }
    return deferred.promise;
};

/**
 * Requests user's saved tracks in blocks of 50, iterates through and saves each new artist it runs into. Repeats until
 * all of the user's saved tracks have been processed.
 * @param user
 */
Api.prototype.getLibraryArtists = function (user) {
    var self = this;
    const api = this.spotifyApi;
    const limit = 50;
    var offset = 0,
        deferred = Q.defer(),
        country = null;
    // get country code because from_token doesnt work with is_playable property for some stupid reason
    api.getMe()
        .then(function (data) {
            country = data.body.country;
        });


    //  recursive wrapper
    function go() {
        self.setAccessToken(user)
            .then(function () {
                api.getMySavedTracks({
                        limit: limit,
                        offset: offset
                    })
                    .then(function (data) {
                        // iterate through the 50 tracks that are returned
                        for (var i = 0; i < data.body.items.length; i++) {
                            var track = data.body.items[i].track;
                            // grab primary artist id and ignore features
                            var artistId = track.artists[0].id;
                            // if we havent added the artist already and the artist currently is active on spotify
                            if (self.artistAdded[artistId] === undefined) {
                                var name = track.artists[0].name;
                                self.artistAdded[artistId] = true; // flag artist added
                                self.artists.push({
                                    spotify_id: artistId,
                                    name: name
                                }); // push artist to array
                            }
                        }
                        // adjust offset to either 50 ahead or to the end of the track list
                        offset += limit;
                        // if offset is behind the end of the track list
                        if (offset < data.body.total - 1) {
                            setTimeout(go, 250); // run again
                        } else {
                            logger.info('artists successfully grabbed with a length of: ' + self.artists.length);
                            deferred.resolve(self.artists); // return array
                        }
                    })
                    // catch getMySavedTracks errors
                    .catch(function (err) {
                        deferred.reject('**GET MY SAVED TRACKS**' + err); // return error message
                    });
            })
            // catch get access token error
            .catch(function (err) {
                logger.error(err);
            });
    }
    // begin recursive call
    go();
    return deferred.promise;
};

/**
 * queries the spotify api for an artist and returns the results
 * @param user
 * @param query
 */
Api.prototype.searchArtists = function (user, query) {
    const limit = 8;
    var deferred = Q.defer(),
        api = this.spotifyApi,
        offset = 0,
        query = query.trim() + '*';

    this.setAccessToken(user)
        .then(function () {
            api.searchArtists(query, ({
                    limit: limit,
                    offset: offset,
                    from_token: user.accessToken.token
                }))
                .then(function (res) {
                    var results = [];
                    for (var i = 0; i < res.body.artists.items.length; i++) {
                        var artist = res.body.artists.items[i];
                        var url =
                            res.body.artists.items[i].images.length > 0 ?
                            res.body.artists.items[i].images[res.body.artists.items[i].images.length - 1].url :
                            '';

                        results.push({
                            name: artist.name,
                            spotify_id: artist.id,
                            url: url
                        })
                    }
                    deferred.resolve(results);
                })
                .catch(function (err) {
                    logger.error(err);
                    deferred.reject(err);
                })
        });
    return deferred.promise;
};

/**
 * Returns boolean based on whether the playlist exists for the user
 * @param user document
 * @returns Promise<Boolean> playlist exists
 */
Api.prototype.playlistExists = function (user) {
    return new Promise((resolve, reject) => {
        this.getAccessToken(user)
            // .then(function (accessToken) {
            //     return api.setAccessToken(accessToken.token);
            // })
            .then(function (token) {
                return isFollowingPlaylist(token, user);
                // return api.getUserPlaylists(user.spotify_id);
                //return api.getPlaylist(user.name, user.playlist.id);
            })
            .then(function (result) {
                return resolve(JSON.parse(result));
            })
            .catch(function (err) {
                logger.error(err);
                return resolve(false);
            })
    });
}

/** 
 * TODO:
 * SET PLAYLIST DETAIL IN IT'S OWN METHOD
 * ADD MOST RECENT MONDAY AS WEEK OF XXXXX
 * Create a spotifier.io playlist for the specified user.
 * This is run when the user's cookie isn't serialized, so we need to retrieve it 
 * from the refresh_token saved in the user's object.
 * @param {object} user user document
 * @returns {Promise<string>} the id of the created playlist
 */
Api.prototype.createPlaylist = function (user) {
    var api = this.spotifyApi;
    var deferred = Q.defer();
    var playlistName = configPublic.spotify.playlistTitle;
    var playlistOptions = {
        'public': false,
        'description': configPublic.spotify.playlistDescription
    }

    this.getAccessToken(user)
        .then(function (accessToken) {
            return api.setAccessToken(accessToken.token);
        })
        .then(function () {
            return api.createPlaylist(user.name, playlistName, playlistOptions);
        })
        .then(function (playlistInfo) {
            deferred.resolve(playlistInfo.body.id);
        })
        .catch(function (err) {
            deferred.reject(err);
        })
    return deferred.promise;
}

/**
 * Update an existing playlist's details to show current weeks date. 
 */
Api.prototype.updatePlaylistDetails = function (user) {
    // TODO:
}

/**
 * Set the api token to the user's token and remove
 * all of the tracks from the user's new release playlist,
 * if it exists.
 */
Api.prototype.emptyPlaylist = function (user) {
    var api = this.spotifyApi;
    var deferred = Q.defer();

    this.getAccessToken(user)
        .then(function (accessToken) {
            return api.setAccessToken(accessToken.token);
        })
        .then(function () {
            return api.getPlaylist(user.name, user.playlist.id);
        })
        .then(function (playlist) {
            var positions = getPositions(playlist.body.tracks.total);
            if (positions.length > 0) {
                api.removeTracksFromPlaylistByPosition(user.name, user.playlist.id, positions, playlist.body.snapshot_id)
                    .then(function () {
                        deferred.resolve();
                    });
            } else {
                deferred.resolve();
            }
        })
        .catch(function (err) {
            deferred.reject(err);
        })
    return deferred.promise;
}

/**
 * Helper function for emptyPlaylist. Generates an array of indices used by the web api.
 * @param {Number} n amount of positions 
 */
function getPositions(n) {
    var positions = [];
    for (var i = 0; i < n; i++) {
        positions.push(i);
    }
    return positions;
}

/**
 * get track information for the user's playlist
 * @param user user document
 * @returns Promise<JSON> spotify playlist track information
 */
Api.prototype.getPlaylistTracks = function (user) {
    var api = this.spotifyApi;
    var deferred = Q.defer();

    this.getAccessToken(user)
        .then(function (accessToken) {
            return api.setAccessToken(accessToken.token);
        })
        .then(function () {
            deferred.resolve(api.getPlaylistTracks(user.name, user.playlist.id));
        })
        .catch(function (err) {
            deferred.reject(err);
        })
    return deferred.promise;
}

/**
 * Refresh a user's access token if necessary, set the access token 
 * to the user's api token, then add the releases to the user's playlist. 
 * @param user user mongo document
 * @returns {Promise<JSON>} Object containing snapshot data of playlist
 */
Api.prototype.addReleaseTracksToPlaylist = function (user) {
    var api = this.spotifyApi;
    var deferred = Q.defer();

    this.getAccessToken(user)
        .then(function (accessToken) {
            logger.info('setting access token.')
            return api.setAccessToken(accessToken.token);
        })
        .then(function () {
            logger.info('converting to uri values.');
            return getArtistTrackUris(user.new_releases);
        })
        .then(function (uris) {
            logger.info('adding tracks to playlist')
            logger.info('uri array length: ' + uris.length);
            var vals = [];
            var twoDFlag = false;
            if (uris.length > 50) {
                vals = chunkArray(uris, 50);
                twoDFlag = true;
            } else {
                vals = uris;
            }

            // this is messy but has less overhead
            function run() {
                var trackUris = [];

                if (twoDFlag === false) {
                    trackUris = vals;
                } else {
                    trackUris = vals.pop();
                }

                if (trackUris.length > 0) {
                    api.addTracksToPlaylist(user.name, user.playlist.id, trackUris)
                        .then(function (data) {
                            if (vals.length > 0 && twoDFlag === true) {
                                run();
                            } else {
                                deferred.resolve(data);
                            }
                        })
                        .catch(function (err) {
                            logger.error('addTracksToPlaylist Error Thrown');
                            deferred.reject(err);
                        });
                } else {
                    deferred.resolve();
                }
            }
            run();
        })
        .catch(function (err) {
            deferred.reject(err);
        })
    return deferred.promise;
}

function isFollowingPlaylist(token, user) {
    logger.debug('requesting user following');
    logger.debug(token.token);

    if (!user.playlist) {
        logger.debug('playlist doesnt exist, returning false');
        return false;
    }

    const params = {
        uri: 'https://api.spotify.com/v1/users/' + user.name + '/playlists/' + user.playlist.id + '/followers/contains?ids=' + user.name,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token.token,
            'content-type': 'application/json'
        },
        json: true
    };
    return request(params)
        .then((following) => {
            return following;
        });
}

/**
 * ------------------------------------------
 * | Private helper for addTracksToPlaylist |
 * ------------------------------------------
 * Get's the track uri values for the specified artists recent release.
 * @param {array} artistIds mongo document ids of artists 
 * @returns {Promise<Array>} array of URI values for the artists
 */
function getArtistTrackUris(artistIds) {
    var deferred = Q.defer();
    getAlbumIds(artistIds)
        .then(function (albumIds) {
            // console.log('getting track uris from releases.');
            return getTrackUrisFromAlbums(albumIds);
        })
        .then(function (uris) {
            deferred.resolve(uris);
        })
        .catch(function (err) {
            // console.log('getArtistTrackUris ERROR');
            deferred.reject(err);
        })
    return deferred.promise;
}

/**
 * Returns an array with arrays of the given size.
 *
 * @param myArray {Array} array to split
 * @param chunk_size {Integer} Size of every group
 */
function chunkArray(myArray, chunk_size) {
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];

    for (index = 0; index < arrayLength; index += chunk_size) {
        myChunk = myArray.slice(index, index + chunk_size);
        // Do something if you want with the group
        tempArray.push(myChunk);
    }

    return tempArray;
}

/**
 * ------------------------------------------
 * | Private helper for addTracksToPlaylist |
 * ------------------------------------------
 * Generates an array of album spotify ids for the specified artists
 * @param {Array} artistIds array of document ids
 * @returns {Promise<Array>} array of spotify_ids
 */
function getAlbumIds(artistIds) {
    var deferred = Q.defer();
    Artist.find({
            $and: [{
                    '_id': artistIds
                },
                {
                    'recent_release.id': {
                        $exists: true
                    }
                }
            ]
        },
        'recent_release',
        function (err, artists) {
            if (err) {
                deferred.reject(err);
            }
            // console.log(artists);
            var ids = artists.map(function (a) {
                if (a.recent_release.id) {
                    return a.recent_release.id;
                }
                // return a.recent_release.id;
            });
            // console.log(ids);
            deferred.resolve(ids);

        });
    return deferred.promise;
}


/**
 * -----------------------------------------
 * | Private helper for getArtistTrackUris |
 * -----------------------------------------
 * Gets track URIs for the specified albums
 * @param {Array} albumIds spotify album ids
 * @returns {Promise<Array>} array of uri values
 */
function getTrackUrisFromAlbums(albumIds) {
    var deferred = Q.defer();
    var api = this.spotifyApi;
    var promises = [];

    for (var i = 0; i < albumIds.length; i++) {
        // console.log(albumIds[i]);
        promises.push(getAlbumsTrackUris(albumIds[i]));
    }
    Q.all(promises)
        .then(function (uris) {
            if (uris.length > 0) {
                var uris = uris.reduce(function (a, b) {
                    return a.concat(b);
                });
            }
            deferred.resolve(uris);
        })
        .catch(function (err) {
            // console.log('getTrackUrisFromAlbums ERROR')
            deferred.reject(err);
        })
    return deferred.promise;
}

/**
 * ---------------------------------------------
 * | Private helper for getTrackUrisFromAlbums |
 * ---------------------------------------------
 * Gets all track URI values for the specified album
 * @param {Object} album spotify album object
 * @returns {Promise<Array>} array of track uri values for album
 */
function getAlbumsTrackUris(albumId) {
    var deferred = Q.defer();
    spotifyServerApi.getAlbumTracks(albumId)
        .then(function (tracks) {
            var totalTracksLength = tracks.items.total;
            var tracks = tracks.items.slice();
            var promises = [];
            var iterated = false;

            if (totalTracksLength > 50) { // if album tracks larger than spotify limit, iterate
                iterated = true;
                logger.info('iterating through tracks');
                for (var offset = 50; offset < totalTracksLength; offset += 50) {
                    promises.push(spotifyServerApi.getAlbumTracksItems(albumId, offset));
                }
            }

            if (iterated === true) {
                Q.all(promises).then(function (iteratedTracks) {
                    tracks.push(iteraredTracks); // push first block
                    var uris = mapUrisFromTracks(tracks);
                    deferred.resolve(uris);
                })
            } else {
                var uris = mapUrisFromTracks(tracks);
                deferred.resolve(uris);
            }
        })
        .catch(function (err) {
            // console.log('getAlbumsTrackUris ERROR');
            // console.log(albumId);
            deferred.reject(err);
        })
    return deferred.promise;
}

/**
 * -----------------------------------------
 * | Private helper for getAlbumsTrackUris |
 * -----------------------------------------
 * Maps the track objects to an array of uri values
 * @param {Array} tracks arr of json objects returned from spotify
 * @returns {Array} array of uri values 
 */
function mapUrisFromTracks(tracks) {
    var uris = tracks.map(function (track) {
        return track.uri;
    });
    return uris;
}

module.exports = Api;