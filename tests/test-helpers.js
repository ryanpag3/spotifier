var Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    User = require('../server/models/user'),
    Artist = require('../server/models/artist'),
    sampleData = require('./sample-test-data'),
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
                            .then(function() {
                                deferred.resolve();
                            })
                        // var iterations = 1;
                        // var index = 0;
                        // // the db can't really handle 100k requests over a period of a few seconds
                        // // so check to make sure we don't crash the db with assignment calls
                        // if (numAssigns > 100000){
                        //     iterations = numAssigns / 10000;
                        //     numAssigns = 10000;
                        // }
                        // run();
                        // function run() {
                        //     setTimeout(function() {
                        //         self.assignRandom(numAssigns)
                        //             .then(function () {
                        //                 User.find({}, function (err, users) {
                        //                     if (err) {
                        //                         deferred.reject(err);
                        //                     }
                        //                     index++;
                        //                     index < iterations ? run() : deferred.resolve();
                        //                 })
                        //             })
                        //             .catch(function (err) {
                        //                 deferred.reject(err);
                        //             })
                        //     }, 10000);
                        // }
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
        var artistCache = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : undefined;
        // this might be redundant to above
        if (artistCache) {
            artistCache = JSON.parse(artistCache);
        } else {
            artistCache = {};
        }

        if (artistCache.syncDate === undefined || Date.parse(artistCache.syncDate) < date) {
            artistCache.syncDate = new Date();
            spotifyServerApi.getNewReleases()
                .then(function (releasesObj) {
                    var releases = [];
                    // convert associative array to regular array
                    var keys = Object.keys(releasesObj);
                    console.log(keys.length);
                    for (var k = 0; k < keys.length; k++) {
                        for (var j = 0; j < releasesObj[keys[k]].length; j++) {
                            releases.push(releasesObj[keys[k]][j]);
                        }
                    }
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
                                            title: release.name,
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
        if (n === undefined) {
            throw new Error('n cannot be undefined!');
        }

        var users = [];
        for (var i = 0; i < n; i++){
            if (i % 2 === 0) {
                users.push(sampleData.passUser());
            } else if (i % 3 === 0) {
                users.push(sampleData.passUser2());
            } else {
                users.push(sampleData.unconfirmedUser());
            }
        }

        User.insertMany(users, function(err) {
           if (err) {
               deferred.reject(err);
           } else {
               console.log('users inserted!');
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
                    // db.assignArtist(users[getRandom(users.length)], artists[getRandom(artists.length)])
                    //     .catch(function (err) {
                    //         deferred.reject(err);
                    //     });

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
                User.remove({}, function(err) {
                    if (err) {
                        console.log(err);
                    }
                  User.insertMany(users, function(err) {
                      if (err) {
                          console.log(err);
                      }
                      Artist.remove({}, function(err) {
                          if (err) {
                              console.log(err);
                          }
                          Artist.insertMany(artists, function(err) {
                              if (err) {
                                  console.log(err);
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
    }
};

// HELPERS
function getRandom(n) {
    return Math.floor(Math.random() * n);
}

























