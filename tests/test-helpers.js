var Q = require('q'),
    fs = require('fs'),
    User = require('../server/models/user'),
    Artist = require('../server/models/artist'),
    sampleData = require('./sample-test-data'),
    Db = require('../server/utils/db-wrapper.js'),
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
    stageSampleNewReleaseDb: function () {
        // insert artists into db
        // track some artists for one user
        // track a different amount of artists for another user
        // return both users information
        var deferred = Q.defer();
        var db = new Db();
        var artists = sampleData.newReleaseArtists().slice();
        var finalArtists = [];

        User.create(sampleData.passUser(), function (err, user) {
            User.create(sampleData.passUser2(), function (err, user2) {
                var i = 0;
                run();

                function run() {
                    Artist.create(artists[i], function (err, artist) {
                        if (err) {
                            console.log(err);
                        }
                        finalArtists.push(artist);
                        if (i++ < artists.length - 1) {
                            setTimeout(run, 0);
                        } else {
                            db.assignArtist(user, finalArtists[0]);
                            db.assignArtist(user, finalArtists[1]);
                            // db.assignArtist(user, finalArtists[2]);
                            db.assignArtist(user2, finalArtists[0]);
                            db.assignArtist(user2, finalArtists[2]);
                            db.assignArtist(user2, finalArtists[3]);
                            setTimeout(function () {
                                User.find({}, function (err, users) {
                                    deferred.resolve(users);
                                });
                            }, 50); // give a bit of a buffer to allow for db serialization
                        }
                    });
                }
            });
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
        // check recent release cache time
        var artistCache = fs.readFileSync('./artist-release-cache.txt', 'utf-8');
        if (artistCache) {
            artistCache = JSON.parse(artistCache);
        } else {
            artistCache = {};
        }
        if (artistCache.syncDate === undefined || artistCache.syncDate < date) {
            artistCache.syncDate = new Date();
            spotifyServerApi.getNewReleases()
                .then(function (releases) {
                    artistCache.releases = releases;
                    fs.writeFile('./artist-release-cache.txt', JSON.stringify(artistCache, null, 4), function(err) {
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
     * or their second most recent release to their document by random.
     * @param num
     */
    addRandomArtists: function (n) {
        var deferred = Q.defer();
        // get releases from the past two weeks
        this.getArtists()
            .then(function(releases) {
                var i = 0;
                var pos = getRandom(releases.length - 1);
                var ranNums = [pos];
                insertNewArtist();
                function insertNewArtist() {
                    while(ranNums.indexOf(pos) !== -1){
                        pos = getRandom(releases.length - 1);
                    }
                    ranNums.push(pos);
                    console.log(pos);
                    console.log(releases[pos].name);
                    i++;
                    if (pos % 2 === 0){
                        spotifyServerApi.getRecentRelease(releases[pos])
                            .then(function(release) {
                                if (i < n) {
                                    insertNewArtist();
                                } else {
                                    deferred.resolve('job done!');
                                }
                            })
                            .catch(function(err) {
                                console.log(err);
                            })
                    } else {
                        spotifyServerApi.getSecondRecentRelease(releases[pos])
                            .then(function(release) {
                                if (i < n) {
                                    insertNewArtist();
                                } else {
                                    deferred.resolve('job done!');
                                }})
                            .catch(function(err) {
                                console.log(err);
                            })
                    }
                }
            });
        return deferred.promise;
    }
};

// HELPERS
function getRandom(n) {
    return Math.floor(Math.random() * n);
}

























