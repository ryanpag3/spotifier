"use strict";

/**
 *  This file provides wrapper functions for managing the user mongodb collection.
 */
var Q = require('q'),
    User = require('../models/user.js'),
    Artist = require('../models/artist.js');

/**
 * @constructor
 */
var Db = function () {
    this._addIndex = 0;
    this._userAssignCalls = 0;
    this._artistAssignCalls = 0;
};

/**
 * creates a new user document in the db
 * @param mUser: user object serialized in cookie {name, accessToken, refreshToken}
 */
Db.prototype.createUser = function (mUser) {
    var deferred = Q.defer(),
        username = mUser.name;
    User.findOne({'name': mUser.name}, function (err, user) {
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

/**
 * queries for user and returns user information
 * todo: add error handling for non-existent users
 * @param mUser: user object serialized in cookie {name, accessToken, refreshToken}
 * @returns: {Promise} Promise object with user document information from mongodb
 */
Db.prototype.getUser = function (mUser) {
    var deferred = Q.defer();
    User.findOne({'name': mUser.name}, function (err, user) {
        if (user){
            deferred.resolve(user);
        } else {
            deferred.reject('user not found in database...');
        }
    });
    return deferred.promise;
};

/**
 * queries for user information and adds all artists in array
 * @param mUser: user object serialized in cookie {name, accessToken, refreshToken}
 * @param artists: array of simple artist objects to retrieve detailed information and
 *                 add to db
 */
Db.prototype.addAllArtists = function (mUser, artists) {
    var db = this,
        i = this._addIndex;

    this.getUser(mUser)
        .then(function (user) {
            go(); // start
            function go() {
                // add artist
                db.addArtist(user, artists[i++]);
                // if reached end of artists array
                if (i < artists.length) {
                    setTimeout(go, 0);
                } else {
                    // serialize user doc once all artists are added
                    // user.save(function (err) {
                    //     if (err) {
                    //         console.log(err);
                    //     }
                    // });
                }
            }

        });
};

/**
 * queries for user information and adds artist to user library
 * @param user: user object serialized in cookie {name, accessToken, refreshToken}
 * @param artist: simple artist object {spotifyId, name}
 */
Db.prototype.addArtist = function (user, artist) {
    var db = this;
    var deferred = Q.defer(),
        jobQueue = require('../utils/job-queue');

    // query for user
    var query = {'name' : user.name};
    User.findOne(query, function(err, user) {
        if (err) {
            deferred.reject(err);
        }
        // query for artist, create if doesnt exist
        var query = {'spotify_id' : artist.spotify_id},
            update = {
                name: artist.name,
                spotify_id: artist.spotify_id,
                recent_release: {
                    title: 'recent release information pending from Spotify'
                }
            },
            options = {'upsert': true, 'new': true};

        Artist.findOne(query, function(err, artist) {
           if (artist) {
              db.assignArtist(user, artist);
              deferred.resolve();
           } else {
               Artist.create(update, function(err, artist) {
                   if (err) {
                       deferred.reject(err);
                   }
                   jobQueue.createGetArtistDetailsJob({artist: artist}, function (album) {
                       // assign album information once job has been processed
                       artist.recent_release = {
                           id: album.id,
                           title: album.name,
                           release_date: album.release_date,
                           images: album.images
                       };
                       artist.save();
                   });

                   db.assignArtist(user, artist);
                   deferred.resolve();
               })
           }
        });
    });
    return deferred.promise;

    // var db = this,
    //     deferred = Q.defer();
    // // error handling
    // if (mUser === null) {
    //     deferred.reject('user cannot be null!');
    // } else if (mArtist === null) {
    //     deferred.reject('artist cannot be null!')
    // }
    //
    // // get detailed user information
    // db.getUser(mUser)
    //     .then(function (user) {
    //         // add to user library
    //         db.add(user, mArtist);
    //         setTimeout(function() {
    //             user.save(function (err) {
    //                 if (err) {
    //                     console.log(err);
    //                 }
    //             });
    //         }, 10);
    //         deferred.resolve();
    //     })
    //     // catch err
    //     .catch(function(err) {
    //         deferred.reject(err);
    //     });
    // return deferred.promise;
};

/**
 * add an artist to a user library
 * @param user: this is the full mongodb user object
 * @param mArtist: simple artist object {spotifyId, name}
 */
// Db.prototype.add = function (user, mArtist) {
//     var db = this,
//         jobQueue = require('../utils/job-queue.js');
//
//     Artist.findOne({'spotify_id': mArtist.spotify_id}, function (err, artist) {
//         if (artist === null) {
//             db.createArtist(mArtist)
//                 .then(function (artist) {
//                     db.assignArtist(user, artist);
//                 })
//                 .catch(function (err) {
//                     console.log(err);
//                 })
//         } else if (artist.recent_release.id === undefined) {
//             jobQueue.createGetArtistDetailsJob({artist: mArtist}, function (album) {
//                 // assign album information once job has been processed
//                 artist.recent_release = {
//                     id: album.id,
//                     title: album.name,
//                     release_date: album.release_date,
//                     images: album.images
//                 };
//                 artist.save();
//             });
//         } else {
//             db.assignArtist(user, artist);
//         }
//     })
// };

/**
 * Creates a new artist entry in the database, does not check if artist is currently in db
 * because calling function does. Might need to change that later.
 * @param mArtist: simple artist object {name, spotifyId}
 * @returns: {Promise} Promise object with artist document information from db
 * @returns: {Promise} Promise object with error message from mongoose
 **/
Db.prototype.createArtist = function (mArtist) {
    var deferred = Q.defer(),
        jobQueue = require('../utils/job-queue.js');
    var artist = new Artist({
        spotify_id: mArtist.spotifyId,
        name: mArtist.name,
        recent_release: {
            title: 'recent release info pending from Spotify...' // placeholder
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
};

/**
 * Associates an artist and a user by serializing their respective id's to their
 * database document.
 * @param user: mongodb user document, see models/user for schema information
 * @param artist: mongodb artist document, see models/artist for schema information
 * todo: handle error thrown during serialization
 */
Db.prototype.assignArtist = function (user, artist) {
    // if artist has not already added user, push id to tracking list
    Artist.update({_id: artist._id}, {$addToSet: {users_tracking: user._id}}, function(err) {
        if (err) {
            console.log(err);
        }
    });

    // if user is not already tracking artist, push id to tracking list
    User.update({_id: user._id}, {$addToSet: {saved_artists: artist._id}}, function(err) {
        if (err) {
            console.log(err);
        }
    });
};

/**
 *
 * @param user
 * @param artist
 */
Db.prototype.removeArtist = function (user, artist) {
    var deferred = Q.defer();
    // query for user information
    User.findOne({'name' : user.name}, function(err, user) {
        // query for artist information, remove user objectId from tracking array
        Artist.findOneAndUpdate({'spotify_id': artist.spotify_id}, {$pull: {'users_tracking': user._id}},
            function(err, artist) {
                // remove artist ObjectId from user tracking array
                User.update({'_id' : user._id}, {$pull: {'saved_artists': artist._id}},
                    function(err) {
                        if (err) {
                            console.log(err);
                            deferred.reject(err);
                        } else {
                            deferred.resolve();
                        }
                });
            if (err) {
                console.log(err);
                deferred.reject(err);
            }
        })
    });
    return deferred.promise;
};

/**
 * retrieves the user's library from the db
 * @param mUser: user object serialized in cookie {name, accessToken, refreshToken}
 * @returns: {Promise} Promise object with user library artist information
 * todo: refactor to use getUser method
 */
Db.prototype.getLibrary = function (mUser) {
    var deferred = Q.defer();
    User.findOne({'name': mUser.name}, function (err, user) {
        var artistIds = user.saved_artists;
        Artist.find({'_id': artistIds}, function (err, artists) {
            deferred.resolve(artists);
        })
    });
    return deferred.promise;
};

/**
 * returns boolean whether user exists in mongodb
 * @param mUser: user object serialized in cookie {name, accessToken, refreshToken}
 * @returns: {boolean}
 */
Db.prototype.userExists = function (mUser) {
    User.findOne({'username': mUser.name}, function (err, user) {
        if (err) {
            console.log(err);
        }
        return user !== null;
    })
};

/**
 * returns boolean based on whether the user has an email in the database
 * @param mUser: user object serialized in cooke {name, accessToken, refreshToken}
 * @returns: {boolean}
 */
Db.prototype.emailExists = function (mUser) {
    User.findOne({'username': mUser}, function (err, user) {
        if (err) {
            console.log(err);
        }
        return user !== null && user.email.address !== null;
    })
};

/**
 * returns boolean based on whether the user has confirmed their email in the database
 * @param mUser: user object serialized in cooke {name, accessToken, refreshToken}
 * @returns {boolean}
 */
Db.prototype.emailConfirmed = function (mUser) {
    User.findOne({'username': mUser.name}, function (err, user) {
        if (err) {
            console.log(err);
        }
        return user !== null && user.email.confirmed === true;
    });

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