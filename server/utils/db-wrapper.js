/**
 *  This file provides wrapper functions for managing the user mongodb collection.
 */
var Q = require('q'),
    User = require('../models/user.js'),
    Artist = require('../models/artist.js');
// jobQueue = require('../utils/job-queue.js');

var Db = function () {
    this.addIndex = 0;
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
    var db = this,
        i = this.addIndex;

    this.getUser(mUser)
        .then(function(user) {
            go();
            function go() {
                db.addArtist(user, artists[i++]);
                if (i < artists.length) {
                    setTimeout(go, 0);
                }
            }
        });
};



Db.prototype.getUser = function(user) {
  var deferred = Q.defer();
  User.findOne({'name' : user.name}, function(err, user) {
      deferred.resolve(user);
  });
    return deferred.promise;
};

/** add artist to user library **/
Db.prototype.addArtist = function (user, mArtist) {
    var db = this,
        jobQueue = require('../utils/job-queue.js');
    Artist.findOne({'spotify_id' : mArtist.spotifyId}, function(err, artist) {
       if (artist === null) {
            db.createArtist(mArtist)
                .then(function(artist) {
                    db.assignArtist(user, artist);
                })
                .catch(function(err) {
                    console.log(err);
                })
        } else if (artist.recent_release.id === undefined){
           jobQueue.createGetArtistDetailsJob({artist: mArtist}, function(album) {
               // assign album information once job has been processed
               artist.recent_release = {
                   id: album.id,
                   title: album.name,
                   release_date: album.release_date,
                   images: album.images
               };
               artist.save();
           });
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
        var db = this;

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

// debug tool for validating libraries
// Db.prototype.validateArtistLibrary = function(mUser, mArtists) {
//   User.findOne({'name' : mUser.name}, function(err, user) {
//       if (err) {
//           console.log(err);
//       }
//       if (user) {
//           Artist.find({'_id' : user.saved_artists}, function(err, artists) {
//               var mNames = [], names = [];
//               for (var i = 0; i < mArtists.length;  i++) {
//                   mNames.push(mArtists[i].name);
//               }
//
//               for (var x = 0; x < artists.length;  x++) {
//                   names.push(artists[x].name);
//               }
//
//               for (var j = 0; j < artists.length; j++) {
//                   if (!mNames.includes(artists[j].name)) {
//                       console.log('user library incorrectly added, artist on db that is not on user library');
//                       console.log('scanned user library did not contain: ' + artists[j].name + ' for ' + mUser.name);
//                       console.log(mUser.name + '\'s library size: + ' + mArtists.length);
//                   }
//               }
//
//               for (var k = 0; k < mArtists.length; k++) {
//                   if (!names.includes(mArtists[k].name)) {
//                       console.log('user library incorrectly added, artist on user library but not on db');
//                       console.log('db library does not contain: ' + mArtists[k].name + ' for ' + mUser.name);
//                   }
//               }
//           })
//       } else {
//           console.log(mUser.name +  ' does not exist in database.')
//       }
//   })
// };

module.exports = Db;