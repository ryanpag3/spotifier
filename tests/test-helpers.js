var Q = require('q'),
    User = require('../server/models/user'),
    Artist = require('../server/models/artist'),
    sampleData = require('./sample-test-data'),
    Db = require('../server/utils/db-wrapper.js');

module.exports = {
    insert: function(user) {
        var deferred = Q.defer();
        User.create(user, function(err, user) {
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
    stageSampleNewReleaseDb: function() {
        // insert artists into db
        // track some artists for one user
        // track a different amount of artists for another user
        // return both users information
        var deferred = Q.defer();
        var db = new Db();
        var artists = sampleData.newReleaseArtists().slice();
        var finalArtists = [];

        User.create(sampleData.passUser(), function(err, user) {
            User.create(sampleData.passUser2(), function(err, user2) {
                var i = 0;
                run();
                function run() {
                    Artist.create(artists[i], function(err, artist) {
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
                            setTimeout(function() {
                                User.find({}, function(err, users) {
                                    deferred.resolve(users);
                                });
                            }, 50); // give a bit of a buffer to allow for db serialization
                        }
                    });
                }
            });
        });
        return deferred.promise;
    }

};