var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    User = require('../server/models/user'),
    Artist = require('../server/models/artist'),
    sampleData = require('./sample-test-data'),
    Db = require('../server/utils/handler-db.js'),
    spotifyServerApi = require('../server/utils/spotify-server-api');

module.exports = {
    insert: function (user) {
        var deferred = Q.defer();
        User.create(user, function (err, user) {
            deferred.resolve(user);
        });
        return deferred.promise;
    },

    /**
     * This stages the dummy database with two users who are tracking different artists.
     * The artists have both new releases and not new releases and users are tracking combinations
     * of both. It will be used to test the new release email service.
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
                                User.find({}, function (err, users) {
                                    if (err) {
                                        deferred.reject(err);
                                    }
                                    deferred.resolve();
                                })
                            })
                            .catch(function (err) {
                                deferred.reject(err);
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
     * For testing, we don't want to query spotify every time we run our methods. In production
     * we will only be querying spotify once a day when we check for new releases, so there is no
     * need to cache artist results. This method caches the results of getNewReleases() into a file
     * and only refreshes the cache if 24 hours have passed.
     */
    getArtists: function () {
        var deferred = Q.defer();
        var date = new Date();
        date.setDate(date.getDate() - 1); // move date back 24 hours
        var p = path.join(__dirname, './artist-release-cache.txt');
        // read file if exists, otherwise define
        var artistCache = fs.readFileSync(p, 'utf-8');
        // this might be redundant to above
        if (artistCache) {
            artistCache = JSON.parse(artistCache);
        } else {
            artistCache = {};
        }

        if (artistCache.syncDate === undefined || Date.parse(artistCache.syncDate) < date) {
            artistCache.syncDate = new Date();
            spotifyServerApi.getNewReleases()
                .then(function (releases) {
                    artistCache.releases = releases;
                    // write file, create if doesnt exist
                    fs.writeFile(p, JSON.stringify(artistCache, null, 4), {flag: 'w'} ,function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('save successful!');
                            deferred.resolve(artistCache.releases);
                        }
                    });
                })
        } else {
            deferred.resolve(artistCache.releases);
        }
        return deferred.promise;
    },

    /**
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
        if (!n) {
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
                                            id: release.id,
                                            release_date: release.release_date,
                                            images: release.images
                                        }
                                    };
                                    Artist.create(artist, function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log('artist: ' + i++ + '/' + n + ' created.');
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
                                console.log(err);
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
                                            id: release.id,
                                            release_date: release.release_date,
                                            images: release.images
                                        }
                                    };
                                    Artist.create(artist, function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log('artist: ' + i++ + '/' + n + ' created.');
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
                                console.log(err);
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
        if (!n) {
            throw new Error('n cannot be undefined!');
        }
        var i = 1;
        run();

        function run() {
            var user;
            if (i % 2 === 0) {
                user = sampleData.passUser();
            } else {
                user = sampleData.passUser2();
            }
            User.create(user, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('user: ' + i++ + '/' + n + ' created.');
                    if (i <= n) {
                        run();
                    } else {
                        deferred.resolve('job done!');
                    }
                }
            })
        }

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
        var db = new Db();

        User.find({}, function (err, users) {
            if (err) {
                deferred.reject(err);
            }
            Artist.find({}, function (err, artists) {
                if (err) {
                    deferred.reject(err);
                }

                for (var i = 0; i < n; i++) {
                    db.assignArtist(users[getRandom(users.length - 1)], artists[getRandom(artists.length - 1)])
                        .catch(function (err) {
                            deferred.reject(err);
                        });
                }
                setTimeout(function () {
                    deferred.resolve();
                }, 100);
            })
        });
        return deferred.promise;
    }
};

// HELPERS
function getRandom(n) {
    return Math.floor(Math.random() * n);
}

























