/** This file handles all the client authenticated calls to the spotify api. **/
var SpotifyApi = require('spotify-web-api-node'),
    Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    credentials = {
        clientId: '5c3f5262d39e44ec999a8a0a9babac3e',
        clientSecret: 'a0d232e3a1844de785777c20944f2618'
    },
    spotifyApi = new SpotifyApi(credentials); // instantiate api object

var self = module.exports = {

    refreshClientToken: function () {
        var deferred = Q.defer();
        // request new access token
        spotifyApi.clientCredentialsGrant()
            .then(function (data) {
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
                spotifyApi.getArtistAlbums(artist.spotify_id, ({
                    limit: 1,
                    offset: 0
                }))
                    .then(function (data) {
                        if (data.body.items.length > 0) {
                            self.getAlbumInfo(data.body.items[0].id)
                                .then(function (data) {
                                    deferred.resolve(data);
                                })
                                .catch(function (err) {
                                    deferred.reject('**GET ALBUM INFO**' + err);
                                })
                        } else {
                            deferred.resolve();
                        }
                    })
                    .catch(function (err) {
                        deferred.reject(err);
                    })
            })
            .catch(function (err) {
                deferred.reject('**REFRESH CLIENT TOKEN**' + err);
            });
        return deferred.promise;
    },

    getAlbumInfo: function (albumId) {
        var deferred = Q.defer();
        self.refreshClientToken()
            .then(function () {
                spotifyApi.getAlbum(albumId)
                    .then(function (data) {
                        deferred.resolve(data.body);
                    })
                    .catch(function (err) {
                        deferred.reject('**GET ALBUM**' + err);
                    })
            })
            .catch(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    },

    getRecentReleaseId: function (artist) {
        var deferred = Q.defer();
        self.refreshClientToken()
            .then(function () {
                spotifyApi.getArtistAlbums(artist.spotify_id, ({
                    limit: 1,
                    offset: 0
                }))
                    .then(function (data) {
                        deferred.resolve(data.body.items[0].id);
                    })
                    .catch(function (err) {
                        deferred.reject('**GET ARTIST ALBUMS**' + err);
                    })
            })
            .catch(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    },

    /**
     * Gets all albums released in the last two weeks.
     */
    getNewReleases: function () {
        var deferred = Q.defer();
        var releases = [];
        var artistAdded = {};
        var query = 'tag:new';
        var checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - 1); // 24 hours
        var p = path.join(__dirname, './cache/cached-new-releases.txt');
        var cachedReleases = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : {};

        // if (cachedReleases) {
        //     cachedReleases = JSON.parse(cachedReleases);
        // }
        // if syncDate has not been set or syncDate is older than 24 hours from this point
        if (!cachedReleases.syncDate || cachedReleases.syncDate < checkDate){
            cachedReleases.syncDate = new Date();
            self.refreshClientToken()
                .then(function () {
                    run();
                    var offset = 0;

                    function run() {
                        spotifyApi.searchAlbums(query, {
                            limit: 50,
                            offset: offset
                        })
                            .then(function (data) {
                                console.log(offset + '/' + data.body.albums.total);
                                for (var i = 0; i < data.body.albums.items.length; i++) {
                                    var album = {
                                        spotify_id: data.body.albums.items[i].artists[0].id,
                                        name: data.body.albums.items[i].artists[0].name,
                                        recent_release: {
                                            id: data.body.albums.items[i].id,
                                            title: data.body.albums.items[i].name
                                        }
                                    };
                                    if (!artistAdded[album.name]){
                                        artistAdded[album.name] = true;
                                        releases.push(album);
                                    }
                                }
                                offset = offset + 50;
                                if (offset < data.body.albums.total) {
                                    run();
                                } else {
                                    cachedReleases.releases = releases;
                                    fs.writeFile(path.join(__dirname, './cache/cached-new-releases.txt'), JSON.stringify(cachedReleases, null, 4), {flag: 'wx'}, 'utf-8');
                                    deferred.resolve(releases);
                                }
                            })
                            .catch(function (err) {
                                console.log(err);
                                run();
                            })
                    }
                })
                .catch(function (err) {
                    console.log(err);
                });
        } else {
            deferred.resolve(cachedReleases.releases);
        }

        return deferred.promise;
    },

    // USED FOR TESTING PURPOSES ONLY
    // DUPLICATE CODE DUE TO MAINTAINING PROD METHOD READABILITY
    getSecondRecentRelease: function (artist) {
        var deferred = Q.defer();
        // ensure fresh token
        self.refreshClientToken()
            .then(function () {
                // retrieve most recent release
                spotifyApi.getArtistAlbums(artist.spotify_id, ({
                    limit: 9,
                    offset: 0
                }))
                    .then(function (data) {
                        var albumId;
                        var i = 0;
                        // skip generic artists like 'various artists' who don't have any album releases
                        if (data.body.items.length > 0) {
                            // skip international releases to find next new album
                            while (data.body.items[0].name === data.body.items[i].name) {
                                if (i < data.body.items.length - 1){
                                    i++;
                                } else {
                                    break;
                                }
                            }
                            albumId = data.body.items[i].id;
                            self.getAlbumInfo(albumId)
                                .then(function (data) {
                                    deferred.resolve(data);
                                })
                                .catch(function (err) {
                                    deferred.reject('**GET ALBUM INFO**' + err);
                                })
                        } else {
                            deferred.resolve();
                        }
                    })
                    .catch(function (err) {
                        deferred.reject(err);
                    })
            })
            .catch(function (err) {
                deferred.reject('**REFRESH CLIENT TOKEN**' + err);
            });
        return deferred.promise;
    }
};





























