/**
 *  This file provides wrapper functions for managing the user mongodb collection.
 */
var Q = require('q'),
    User = require('../models/user.js'),
    Artist = require('../models/artist.js');
// jobQueue = require('../utils/job-queue.js');

var Db = function () {
    this.id = Math.floor(Math.random() * 100);
};

Db.prototype.createUser = function (user) {
    var deferred = Q.defer(),
        username = user.name;
    User.findOne({'name': user.name}, function (err, user) {
        if (err) {
            console.log(err);
        }
        // check if exists
        if (user === null) {
            var user = new User({
                name: username
            }).save(function (err, user) {
                deferred.resolve();
            });
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

Db.prototype.addAllArtists = function(mUser, artists) {
    console.log('addAllArtists ' + mUser.name + ' and ' + artists.length);
    var db = this;
    var i = 0;
    var u = null;

    this.getUser(mUser)
        .then(function(user) {
            go();
            function go() {
                // console.log('add artist ' + user.name + ' and ' + artists[i].name + ' and ' + artists.length);
                db.addArtist(user, artists[i++]);
                if (i < artists.length - 1) {
                    setTimeout(go, 50);
                } else {
                    // do nothing
                }
            }
        });

};

Db.prototype.getUser = function(user) {
  var deferred = Q.defer();
  User.findOne({'name' : user.name}, function(err, user) {
      // console.log('query run and found ' + user.name);
      deferred.resolve(user);
  });
    return deferred.promise;
};

/** add artist to user library **/
Db.prototype.addArtist = function (user, mArtist) {
    // console.log(user.name + ' is adding ' + mArtist.name);
    var db = this;
    // query for user
    // User.findOne({'name': mUser.name}, function (err, user) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     // if user does not exist
    //     if (user === null) {
    //         // create user and start over
    //         db.createUser(mUser)
    //             .then(function () {
    //                 db.addArtist(mUser, mArtist);
    //             })
    //     } else {
    //         // query for artist
    //         Artist.findOne({'spotify_id': mArtist.spotifyId}, function (err, artist) {
    //             // if exists in db
    //             if (artist !== null) {
    //                 db.assignArtist(mUser, mArtist);
    //             } else {
    //                 // create new artist entry in db and call addArtist again
    //                 db.createArtist(mArtist)
    //                     .then(function () {
    //                         // assign user to artist
    //                         db.assignArtist(mUser, mArtist);
    //                     })
    //                     .catch(function (err) {
    //                         console.log(err);
    //                     })
    //             }
    //         })
    //     }
    // });

    Artist.findOne({'spotify_id' : mArtist.spotifyId}, function(err, artist) {
       if (artist === null) {
            db.createArtist(mArtist)
                .then(function(artist) {
                    db.assignArtist(user, artist);
                })
                .catch(function(err) {
                    console.log(err);
                })
        } else {
            db.assignArtist(user, artist);
        }

    })
};

/** create new artists in database **/
Db.prototype.createArtist = function (mArtist) {
    var deferred = Q.defer(),
        jobQueue = require('../utils/job-queue.js');
    var artist = new Artist({
        spotify_id: mArtist.spotifyId,
        name: mArtist.name,
        recent_release: {
            title: 'waiting on album info from spotify...' // placeholder
        }
    }).save(function (err, artist) {
        if (err) {
            deferred.reject(err);
        }
        jobQueue.createGetArtistDetailsJob({artist: mArtist}, function (album) {
            // assign album information once job has been processed
            artist.recent_release = {
                id: album.id,
                title: album.name,
                release_date: album.release_date,
                images: album.images
            };
            artist.save();
        });
        deferred.resolve(artist);
    });

    return deferred.promise;
},

    /** assign an artist to a user and vice versa **/
    Db.prototype.assignArtist = function (user, artist) {
        // console.log('assigning ' + user.name + ' to ' + artist.name);
        var db = this;
        // console.log('assigning ' + user.name + ' to ' + artist.name);
        // var db = this;
        // var deferred = Q.defer();
        // User.findOne({'name': mUser.name}, function (err, user) {
        //     if (err) {
        //         deferred.reject(err);
        //     }
        //     // query for artist
        //     Artist.findOne({'spotify_id': mArtist.spotifyId}, function (err, artist) {
        //         if (err) {
        //             deferred.reject(err);
        //         }
        //         // we don't need to check if artist exists because we do it in calling function
        //         // assign user to artist if they arent already
        //         if (!db.artistTrackingUser(artist._id, user._id)) {
        //             console.log('pushing ' + user.name + ' to ' + artist.name);
        //             artist.users_tracking.push(user._id);
        //             artist.save(function (err) {
        //                 deferred.reject(err);
        //             })
        //         }
        //
        //         // assign artist to user if they aren't already
        //         if (!db.userTrackingArtist(artist._id, user._id)) {
        //             console.log('pushing ' + artist.name + ' to ' + user.name);
        //             user.saved_artists.push(artist._id);
        //             user.save(function (err) {
        //                 deferred.reject(err);
        //             })
        //         }
        //     })
        // });
        // return deferred.promise;

                if (!db.artistTrackingUser(artist._id, user._id)) {
                    artist.users_tracking.push(user._id);
                    artist.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                }

                if (!db.userTrackingArtist(artist._id, user._id)) {
                    user.saved_artists.push(artist._id);
                    user.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                }
    };

Db.prototype.removeArtist = function (username, artistId) {

};

/**
 * retrieves the user's library from the db
 * @param username
 */
Db.prototype.getLibrary = function (username) {
    var deferred = Q.defer();
    User.findOne({'name': username}, function (err, user) {
        var artistIds = user.saved_artists;
        Artist.find({'_id': artistIds}, function (err, artists) {
            deferred.resolve(artists);
        })
    });
    return deferred.promise;
};

/**
 * checks if an artist is already tracking a user
 * @param artistId: mongo _id of artist
 * @param userId: mongo _id of user
 */
Db.prototype.artistTrackingUser = function (artistId, userId) {
    Artist.findOne({'_id': artistId}, {'users_tracking': userId}, function (err, artist) {
        if (err) {
            console.log(err);
        }
        return artist !== null;
    })
};

/**
 * checks if a user is already tracking an artist
 * @param artistId: mongo _id of artist
 * @param userId: mongo _id of user
 */
Db.prototype.userTrackingArtist = function (artistId, userId) {
    User.findOne({'_id': userId}, {'saved_artists': artistId}, function (err, user) {
        if (err) {
            console.log(err);
        }
        return user !== null;
    })
};

Db.prototype.userExists = function (username) {
    User.findOne({'username': username}, function (err, user) {
        if (err) {
            console.log(err);
        }
        return user !== null;
    })
};

Db.prototype.emailExists = function (username) {
    User.findOne({'username': username}, function (err, user) {
        if (err) {
            console.log(err);
        }
        return user !== null && user.email.address !== null;
    })
};

Db.prototype.emailConfirmed = function (username) {
    User.findOne({'username': username}, function (err, user) {
        if (err) {
            console.log(err);
        }
    });
    return user !== null && user.email.confirmed === true;
};

module.exports = Db;