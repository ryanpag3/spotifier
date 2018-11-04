var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    Promise = require('bluebird'),
    Db = require('../server/utils/db'),
    logger = require('../server/utils/logger'),
    User = require('../server/models/user'),
    Artist = require('../server/models/artist'),
    sampleData = require('./sample-test-data'),
    spotifyServerApi = require('../server/utils/spotify-server-api'),
    playlistHandler = require('../server/utils/playlist-handler')
    SpotifyAPI = require('../server/utils/spotify-api');

module.exports = self = {
    insert: function (user) {
        var deferred = Q.defer();
        User.create(user, function (err, user) {
            deferred.resolve(user);
        });
        return deferred.promise;
    },

    /**
     * Stage a dummy database by number of users, artists, and assignments
     * @returns {Q.Promise<T>}
     */
    stageSampleNewReleaseDb: function (numUsers, numArtists, numAssigns) {
        var deferred = Q.defer(),
            self = this;

        self.addRandomUsers(numUsers)
            .then(function () {
                logger.debug( 'stageSampleNewReleaseDb', 'added random users');
                self.addRandomArtists(numArtists)
                    .then(function () {
                        logger.debug('stageSampleNewReleaseDb', 'added random artists');
                        self.assignRandom(numAssigns)
                            .then(function () {
                                logger.debug( 'stageSampleNewReleaseDb', 'assigned random');
                                deferred.resolve();
                            })
                    })
                    .catch(function (err) {
                        deferred.reject(err);
                    })
            })
            .catch(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    },


    /**
     * TODO: fix wordy documentation
     * For testing, we don't want to query spotify every time we run our methods. In production
     * we will only be querying spotify once a day when we check for new releases, so there is no
     * need to cache artist results. This method caches the results of getNewReleases() into a file
     * and only refreshes the cache if 24 hours have passed.
     */
    getArtistsOld: function () {
        var deferred = Q.defer();
        var date = new Date();
        date.setDate(date.getDate() - 7); // move date back one week
        var p = path.join(__dirname, './artist-release-cache.txt');
        // read file if exists, otherwise define
        var artistCache = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : undefined;
        // this might be redundant to above
        if (artistCache) {
            // logger.debug('getArtists', 'parsing artist cache');
            artistCache = JSON.parse(artistCache);
        } else {
            artistCache = {};
        }

        if (artistCache.syncDate === undefined || Date.parse(artistCache.syncDate) < date) {
            logger.info('Refreshing release cache, this may take up to ten minutes!');
            logger.info('This only needs to be done once a week so sit tight :)');
            artistCache.syncDate = new Date();
            spotifyServerApi.getNewReleases()
                .then(function (releasesObj) {
                    var releases = [];
                    // convert associative array to regular array
                    var keys = Object.keys(releasesObj);

                    for (var k = 0; k < keys.length; k++) {
                        for (var j = 0; j < releasesObj[keys[k]].length; j++) {
                            releases.push(releasesObj[keys[k]][j]);
                        }
                        if (releases.length >= 25000) {
                            break; // prevent test cache from getting too big
                        }
                    }
                    artistCache.releases = releases;
                    // write file, create if doesnt exist
                    fs.writeFile(p, JSON.stringify(artistCache, null, 4), {
                        flag: 'w'
                    }, function (err) {
                        if (err) {
                            logger.error(err);
                        } else {
                            var waitTime = 30000;
                            setTimeout(function () {
                                logger.info('save to file successful!');
                                logger.info('Pausing thread for ' + waitTime + ' milliseconds to let Spotify catch up.');
                            }, waitTime)
                            deferred.resolve(releases);
                        }
                    });
                })
                .catch((err) => {
                    logger.error(err, err.stack);
                });
        } else {
            // logger.debug('getArtists', 'resolving cached releases');
            deferred.resolve(artistCache.releases);
        }
        return deferred.promise;
    },

    getOldRelease: async (artistId) => {
        const spotAPI = new SpotifyAPI();
        await spotAPI.initialize();
        let albums = await spotAPI.getArtistAlbums(artistId);
        albums = spotAPI.sortAlbumsByRelease(albums);
        if (albums.length == 1) return albums[0];
        return albums[1];
    },

    randomizeReleases: async (albums) => {
        let randomized = [];
        await Promise.map(albums, async (album) => {
            if (Math.random() <= .5) {
                album = await self.getOldRelease(album.artists[0].id)
            };
            randomized.push(album);
        }, {
            concurrency: 3
        });

        return randomized.map((album) => {
            const release = {
                id: album.id,
                title: album.name,
                release_date: album.release_date,
                images: album.images,
                url: album.external_urls.spotify
            }
            return {
                name: album.artists[0].name,
                spotify_id: album.artists[0].id,
                recent_release: release
            }
        });
    },

    /**
     * get n number of indeterminate releases
     */
    getArtists: async (n) => {
        const sAPI = new SpotifyAPI()
        await sAPI.initialize();
        const albums = await sAPI.getAlbums(n);
        return self.randomizeReleases(albums);
    },  

    /**
     * add random artists
     */
    addRandomArtists: async (n) => {
        try {
            const artists = await self.getArtists(n);
            await Promise.map(artists, async artist => {
                return await Artist.create(artist)
            })
        } catch (e) {
            console.log(e);
        }
    },


    /**
     * @deprecated
     * TODO: fix wordy documentation
     * add n amount of random artists to the artists database. This will grab artists only
     * that have releases in the past two weeks and will assign either their most recent release
     * or their second most recent release to their document by random. Code duplication is due to
     * not wanting to add extra logic time to getRecentRelease and have it affect production runtime.
     * The getSecondRecentRelease is a testing method used for creating dummy artists, and there is no
     * reason for checking second recent releases on the release server.
     * @param n: amount of artists to add
     */
    addRandomArtistsOld: function (n) {
        var deferred = Q.defer();
        if (n === undefined) {
            throw new Error('n cannot be undefined!');
        }
        // get releases from the past two weeks
        this.getArtists()
            .then(function (releases) {
                var i = 1;
                var pos = getRandom(releases.length - 1);
                var ranNums = [pos];
                insertNewArtist();

                function insertNewArtist() {
                    while (ranNums.indexOf(pos) !== -1) {
                        pos = getRandom(releases.length - 1);
                    }
                    ranNums.push(pos);

                    if (pos % 2 === 0) {
                        spotifyServerApi.getRecentRelease(releases[pos])
                            .then(function (release) {
                                if (release) {
                                    var artist = {
                                        spotify_id: releases[pos].spotify_id,
                                        name: releases[pos].name,
                                        recent_release: {
                                            title: release.name,
                                            id: release.id,
                                            release_date: release.release_date,
                                            images: release.images
                                        }
                                    };
                                    Artist.create(artist, function (err) {
                                        if (err) {
                                            logger.error(err);
                                        } else {
                                            i++;
                                            logger.debug('random artist ' + (i-1) + '/' + n + ' has been created.');
                                            // console.log('artist: ' + i++ + '/' + n + ' created.');
                                        }
                                    });
                                }
                                if (i < n) {
                                    setTimeout(insertNewArtist, 0);
                                } else {
                                    setTimeout(function () {
                                        logger.info('artists inserted')
                                        deferred.resolve('job done!')
                                    }, 10);
                                }
                            })
                            .catch(function (err) {
                                logger.error(err);
                                i--;
                                insertNewArtist();
                            })
                    } else {
                        spotifyServerApi.getSecondRecentRelease(releases[pos])
                            .then(function (release) {
                                if (release) {
                                    var artist = {
                                        spotify_id: releases[pos].spotify_id,
                                        name: releases[pos].name,
                                        recent_release: {
                                            title: release.name,
                                            id: release.id,
                                            release_date: release.release_date,
                                            images: release.images
                                        }
                                    };
                                    Artist.create(artist, function (err) {
                                        if (err) {
                                            logger.error(err);
                                        } else {
                                            i++;
                                            logger.debug('random artist ' + (i-1) + '/' + n + ' has been created.');
                                            // console.log('artist: ' + i++ + '/' + n + ' created.');
                                        }
                                    });
                                }
                                if (i < n) {
                                    setTimeout(insertNewArtist, 0);
                                } else {
                                    setTimeout(function () {
                                        deferred.resolve('job done!')
                                    }, 10);
                                }
                            })
                            .catch(function (err) {
                                logger.error(err);
                                i--;
                                insertNewArtist();
                            })
                    }

                }
            });
        return deferred.promise;
    },

    /**
     * add n amount of random users to the user collection.
     * @param n
     */
    addRandomUsers: function (n) {
        var deferred = Q.defer();
        if (n === undefined) {
            throw new Error('n cannot be undefined!');
        }

        var users = [];
        for (var i = 0; i < n; i++) {
            if (i % 2 === 0) {
                users.push(sampleData.getPassUser());
            } else if (i % 3 === 0) {
                users.push(sampleData.getPassUser2());
            } else {
                users.push(sampleData.getUnconfirmedUser());
            }
        }

        User.insertMany(users, function (err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    },

    /**
     * randomly associates artists and users
     * @param n: number of random assignments to make
     */
    assignRandom: function (n) {
        var deferred = Q.defer();
        if (n === undefined) {
            deferred.reject('number must be passed as parameter to assignRandom!');
        }

        User.find({}, function (err, users) {
            if (err) {
                deferred.reject(err);
            }
            Artist.find({}, function (err, artists) {
                if (err) {
                    deferred.reject(err);
                }

                for (var i = 0; i < n; i++) {
                    // update arrays
                    // batch save arrays
                    // get position of random user and random artist
                    const userPos = getRandom(users.length);
                    const artistPos = getRandom(artists.length);

                    if (users[userPos].saved_artists.indexOf(artists[artistPos]._id) === -1) {
                        users[userPos].saved_artists.push(artists[artistPos]._id);
                    }
                    if (artists[artistPos].users_tracking.indexOf(users[userPos]._id) === -1) {
                        artists[artistPos].users_tracking.push(users[userPos]._id);
                    }
                }

                // not sure if this is the best way to handle this
                // maybe an updateMany with a filter would be a better approach
                User.remove({}, function (err) {
                    if (err) {
                        logger.error(err);
                    }
                    User.insertMany(users, function (err) {
                        if (err) {
                            logger.error(err);
                        }
                        Artist.remove({}, function (err) {
                            if (err) {
                                logger.error(err);
                            }
                            Artist.insertMany(artists, function (err) {
                                if (err) {
                                    logger.error(err);
                                } else {
                                    deferred.resolve();
                                }
                            })
                        });
                    });
                });
            })
        });
        return deferred.promise;
    },

    stageSpotifyUser: function (numReleases) {
        var self = this;
        var deferred = Q.defer();
        var db = new Db();
        var spotifyUser = sampleData.getSpotifyAuthenticatedUserPlaylistCreated();

        if (!numReleases) {
            throw new Error('stageSpotifyUser: the number of releases is undefined!');
        }

        logger.debug('Staging spotify user');

        this.getArtists(numReleases)
            .then(function (releases) {
                new User(spotifyUser).save(
                    async function (err, user) {
                        if (err) {
                            logger.error('stageSpotifyUser', err);
                        }

                        var p = Q();
                        var promises = [];
                        for (var i = 0; i < numReleases; i++) {
                            var artist = releases[getRandom(releases.length - 1)];
                            await self.stageArtistUser(user, artist);
                        }
                        deferred.resolve(self.stagePlaylist(user));
                    });
            })
            .catch((err) => {
                logger.error(err.toString());
            });
        return deferred.promise;
    },

    stageArtistUser: function (user, artist) {
        var db = new Db();
        return db.addArtist(user, artist)
            .then(function () {
                return self.flagUserArtistRelease(user, artist);
            })
            .catch(err => logger.error(err.toString()));
    },

    flagUserArtistRelease: function (user, artist) {
        var deferred = Q.defer();
        var db = new Db();
        Artist.findOne({
            'spotify_id': artist.spotify_id
        }, function (err, artist) {
            if (err) {
                logger.debug(err);
                deferred.reject();
            }
            db.artistNewReleaseFound(artist);
            deferred.resolve();
        });
        return deferred.promise;
    },

    stagePlaylist: function (user) {
        var deferred = Q.defer();
        // requery for updated object information
        User.findOne({
            '_id': user._id
        }, function (err, user) {
            deferred.resolve(user);
            // logger.debug('creating playlist for ' + user.name);
            // playlistHandler.createPlaylist(user._id)
            //     .then(function (user) {
            //         deferred.resolve(user);
            //     })
            //     .catch(function (err) {
            //         deferred.reject(err);
            //     });
        });
        return deferred.promise;
    },

    /**
     * TODO: docs
     * @param {*} numUsers 
     * @param {*} numReleases 
     */
    stageSpotifyUsers(numUsers, numReleases) {
        var deferred = Q.defer();
        var promises = [];
        var currTime = new Date();
        for (var i = 0; i < numUsers; i++) {
            var newTime = new Date();
            // output time for each user creation
            // console.log(newTime - currTime);
            currTime = newTime;
            promise = this.stageSpotifyUser(numReleases)
            promises.push(promise);
        }
        Q.all(promises).then(function() {
            logger.debug('resolving staging.');
            deferred.resolve();
        });
        return deferred.promise;
    }
}; // end module.exports

// HELPERS
function getRandom(n) {
    return Math.floor(Math.random() * n);
}