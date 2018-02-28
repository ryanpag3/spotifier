var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    JSONStream = require('JSONStream'),
    Db = require('../server/utils/db'),
    logger = require('../server/utils/logger'),
    User = require('../server/models/user'),
    Artist = require('../server/models/artist'),
    sampleData = require('./sample-test-data'),
    spotifyServerApi = require('../server/utils/spotify-server-api'),
    queueGetArtistDetails = require('../server/utils/queue-get-artist-details'),
    playlistHandler = require('../server/utils/playlist-handler');

module.exports = {
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
                self.addRandomArtists(numArtists)
                    .then(function () {
                        self.assignRandom(numAssigns)
                            .then(function () {
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
    getArtists: function () {
        var deferred = Q.defer();
        var date = new Date();
        date.setDate(date.getDate() - 7); // move date back one week
        var p = path.join(__dirname, './artist-release-cache.txt');
        // read file if exists, otherwise define
        var artistCache = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : undefined;
        // this might be redundant to above
        if (artistCache) {
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
                            setTimeout(function() {
                                logger.info('save to file successful!');
                                logger.info('Pausing thread for ' + waitTime + ' milliseconds to let Spotify catch up.'); 
                            }, waitTime)
                            deferred.resolve(releases);
                        }
                    });
                })
        } else {
            deferred.resolve(artistCache.releases);
        }
        return deferred.promise;
    },

    /**
     * TODO: fix wordy documentation
     * add n amount of random artists to the artists database. This will grab artists only
     * that have releases in the past two weeks and will assign either their most recent release
     * or their second most recent release to their document by random. Code duplication is due to
     * not wanting to add extra logic time to getRecentRelease and have it affect production runtime.
     * The getSecondRecentRelease is a testing method used for creating dummy artists, and there is no
     * reason for checking second recent releases on the release server.
     * @param n: amount of artists to add
     */
    addRandomArtists: function (n) {
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

    /**
     * stage new releases for the test spotify account
     * TODO: refactor to use promise chaining instead of recursion
     * I know this is really messy I'm sorry I don't write code like
     * this anymore
     */
    stageSpotifyUser: function (numReleases) {
        if (!numReleases) {
            throw 'numReleases cannot be undefined!';
        }
        var self = this;
        var deferred = Q.defer();
        var db = new Db();
        var spotifyUser = sampleData.getSpotifyAuthenticatedUserPlaylistCreated();
        // get artist releases from last two weeks
        this.getArtists()
            .then(function (releases) {
                logger.debug('got releases from spotify api')
                var user = new User(spotifyUser).save(function (err, user) {
                    // add psuedo new releases
                        var i = 0;
                        run(); // init
                        function run() {
                            var artist = releases[getRandom(releases.length - 1)];
                            // add artist to database
                            db.addArtist(user, artist)
                                .then(function () {
                                    Artist.findOne({
                                        'spotify_id': artist.spotify_id
                                    }, function (err, artist) {
                                        // flag user for new release
                                        db.artistNewReleaseFound(artist);
                                        if (++i < numReleases) {
                                            run();
                                        } else {
                                            User.findOne({
                                                '_id': user._id
                                            }, function (err, user) {
                                                logger.debug('creating playlist for user')
                                                playlistHandler.createPlaylist(user._id)
                                                    .then(function(user) {
                                                        logger.debug('user playlist created');
                                                        deferred.resolve(user);
                                                    })
                                                    .catch(function(err) {
                                                        logger.error('error: ', err);
                                                        deferred.reject(err);
                                                    });
                                                // deferred.resolve(user);
                                            });
                                        }
                                    })
                                })
                                .catch(function (err) {
                                    // TODO:
                                    // console.log add artist vs throw err?
                                });
                        }
                    })
                    .catch(function (err) {
                        deferred.reject(err);
                    });
            })
            .catch(function (err) {
                deferred.reject(err);
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
            promises.push(this.stageSpotifyUser(numReleases));
        }
        deferred.resolve(Q.all(promises));
        return deferred.promise;
    }
}; // end module.exports

// HELPERS
function getRandom(n) {
    return Math.floor(Math.random() * n);
}