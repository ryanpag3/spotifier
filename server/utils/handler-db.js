"use strict";

/**
 *  This file provides wrapper functions for managing the user mongodb collection.
 */
var Q = require('q'),
    User = new require('../models/user.js'),
    Artist = new require('../models/artist.js'),
    publicConfig = require('../../config-public.js');

/**
 * @constructor
 */
var Db = function () {
    this._addIndex = 0;
};

/**
 * creates a new user document in the db
 * @param mUser: user object serialized in cookie {name, accessToken, refreshToken}
 * @returns {Q.Promise|Object} user doc from mongo
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
                name: username,
                email: {
                    confirmed: false
                },
                sync_queue: {
                    status: 'not queued'
                }
            }).save(function (err, user) {
                if (err) {
                    deferred.reject(err);
                }
                deferred.resolve(user);
            });
        } else {
            deferred.resolve(user);
        }
    });
    return deferred.promise;
};

/**
 * queries for user and returns user information
 * @param mUser: user object serialized in cookie {name, accessToken, refreshToken}
 * @returns: {Q.Promise|Object} user document information from mongodb
 */
Db.prototype.getUser = function (mUser) {
    var deferred = Q.defer();
    User.findOne({'_id': mUser._id}, function (err, user) {
        if (user) {
            deferred.resolve(user);
        } else {
            deferred.reject('user not found in database...');
        }
    });
    return deferred.promise;
};

/**
 * Runs a recursive call to add all artists. We use this technique to add artists in
 * order to preserve the natural order of a user's library. A typical for-loop would cause
 * an async shuffle of a user's artist at little-to-no performance improvement.
 * @param user: user object serialized in cookie {name, accessToken, refreshToken}
 * @param artists: array of simple artist objects to retrieve detailed information and
 *                 add to db
 * @param socketUtil: this is the socket utility object used by the artist details queue
 * to alert clients when an artist details job has been found. We pass it to addArtist
 * which handles job creation for that particular queue.
 * @returns {Q.Promise}
 */
Db.prototype.addAllArtists = function (user, artists, socketUtil) {
    var db = this,
        i = this._addIndex,
        deferred = Q.defer();

    go(); // start recursive call
    function go() {
        // add artist
        db.addArtist(user, artists[i++], socketUtil)
            .then(function () {
                if (i < artists.length) {
                    setTimeout(go, 0);
                } else {
                    deferred.resolve(); // end of artist array reached, resolve
                }
            })
            .catch(function (err) {
                deferred.reject(err); // add artist threw error, reject
            });
    }

    return deferred.promise;
};

/**
 * queries the artist collection and returns all documents
 * @returns {Q.Promise<T>}
 */
Db.prototype.getAllArtists = function () {
    var deferred = Q.defer();
    Artist.find({}, function (err, artists) {
        if (err) {
            deferred.reject(err);
        }
        deferred.resolve(artists);
    });
    return deferred.promise;
};

/**
 * queries for user information and adds artist to user library
 * @param user: user object serialized in cookie {name, accessToken, refreshToken}
 * @param artist: simple artist object {spotifyId, name}
 * @param socketUtil: this is the socket utility object that contains the necessary socket.io
 * data to update clients seamlessly when artist details have been found. We pass it to the job
 * creation call.
 * @returns {Q.Promise}
 */
Db.prototype.addArtist = function (user, artist, socketUtil) {
    var db = this;
    var deferred = Q.defer(),
        getArtistDetailsQueue = require('./queue-get-artist-details');

    // query for user
    // define query parameters
    var query = {'spotify_id': artist.spotify_id};
    // query for artist
    Artist.findOne(query, function (err, qArtist) {
        if (err) {
            console.log(err);
        }
        // if exists
        if (qArtist) {
            db.assignArtist(user, qArtist)
                .then(function () {
                    // if artist details have not been added
                    if (qArtist.recent_release.id === undefined) {
                        // initialize a get details job and pass socketUtil object
                        getArtistDetailsQueue.createJob({artist: qArtist});
                    } else {
                        socketUtil.alertArtistDetailsChange(qArtist);
                    }
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
            deferred.resolve();
        } else {
            // if doesn't exist
            // create temporary artist document
            var update = {
                name: artist.name,
                spotify_id: artist.spotify_id,
                recent_release: {
                    title: publicConfig.placeholderAlbumTitle
                }
            };
            // insert into database
            Artist.create(update, function (err, artist) {
                if (err) {
                    console.log('artist.create err thrown');
                    deferred.reject(err);
                } else {
                    // initialize a get details job and pass socketUtil object
                    getArtistDetailsQueue.createJob({artist: artist});
                }
                // associate user and artist
                db.assignArtist(user, artist)
                    .catch(function (err) {
                        deferred.reject('**ASSIGN ARTIST **' + err);
                    });
                deferred.resolve();

            })
        }
    });
    return deferred.promise;
};

/**
 * Disassociates an artist and a user in mongo. First we query for the user doc, then remove the user id
 * from the artist doc, and finally remove the artist id from the user doc.
 * @param user: mongodb document
 * @param artist: mongodb document
 * @returns {Q.Promise}
 */
Db.prototype.removeArtist = function (user, artist) {
    var deferred = Q.defer();
    // query for user information
    User.findOne({'name': user.name}, function (err, user) {
        // query for artist information, remove user objectId from tracking array
        Artist.findOneAndUpdate({'spotify_id': artist.spotify_id}, {$pull: {'users_tracking': user._id}},
            function (err, artist) {
                // remove artist ObjectId from user tracking array
                User.update({'_id': user._id}, {$pull: {'saved_artists': artist._id}},
                    function (err) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve();
                        }
                    });
                if (err) {
                    deferred.reject(err);
                }
            })
    });
    return deferred.promise;
};

/**
 * Updates an artist's values in the Artist collection
 * @param artist: updated schema values
 */
Db.prototype.updateArtist = function (artist) {
    Artist.findOneAndUpdate({'spotify_id': artist.spotify_id}, artist, function (err, artist) {
        if (err) {
            console.log(err);
        }
    })
};

/**
 * Associates an artist and a user by serializing their respective id's to their
 * database document, if they are valid.
 * @param user: mongodb user document, see models/user for schema information
 * @param artist: mongodb artist document, see models/artist for schema information
 * @returns {Q.Promise}
 */
Db.prototype.assignArtist = function (user, artist) {
    var deferred = Q.defer();
    // if artist has not already added user, push id to tracking list
    Artist.update({_id: artist._id}, {$addToSet: {users_tracking: user._id}}, function (err) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        }
        // if user is not already tracking artist, push id to tracking list
        User.update({_id: user._id}, {$addToSet: {saved_artists: artist._id}}, function (err) {
            if (err) {
                console.log(err);
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
    });
    return deferred.promise;
};

/**
 * When the new release scanner finds a new release for an artist, it calls this so that all users
 * who are tracking an artist will have this artist pushed to their new_release field. Once the new
 * release scanner finishes processing all artists, the new_release field will be used to build email
 * notifications.
 * @param artist: mongodb document for an artist
 */
Db.prototype.artistNewReleaseFound = function (artist) {
    User.updateMany({'_id': {$in: artist.users_tracking}}, {$addToSet: {'new_releases': artist._id}}, function (err) {
        if (err) {
            console.log(err);
        }
    })
};

/**
 * retrieves the user's library from the db, if they exist
 * @param mUser: user object serialized in cookie {_id, name, accessToken, refreshToken}
 * @returns: {Q.Promise|Array} Promise object with user library artist information
 */
Db.prototype.getLibrary = function (mUser) {
    var deferred = Q.defer();
    User.findOne({'_id': mUser._id}, function (err, user) {
        if (err) {
            deferred.reject(err);
        }
        if (user) {
            var artistIds = user.saved_artists;
            Artist.find({'_id': artistIds}, function (err, artists) {
                if (err) {
                    deferred.reject(err);
                }
                deferred.resolve(artists);
            })
        }
    });
    return deferred.promise;
};

/**
 * returns boolean whether user exists in mongodb
 * @param mUser: user object serialized in cookie {name, accessToken, refreshToken}
 * @returns: {Q.Promise|Boolean}
 */
Db.prototype.userExists = function (mUser) {
    var deferred = Q.defer();
    User.findOne({'_id': mUser._id}, function (err, user) {
        if (err) {
            console.log(err);
        }
        deferred.resolve(user !== null);
    });
    return deferred.promise
};

/**
 * returns boolean based on whether the user has an email in the database
 * @param mUser: user object serialized in cooke {name, accessToken, refreshToken}
 * @returns: {Q.Promise|Boolean}
 */
Db.prototype.emailExists = function (mUser) {
    var deferred = Q.defer();
    User.findOne({'_id': mUser._id}, function (err, user) {
        if (err) {
            console.log(err);
        }
        deferred.resolve(user !== undefined && user.email.address !== undefined);
    });
    return deferred.promise;
};

/**
 * returns boolean based on whether the user has confirmed their email in the database
 * @param mUser: user object serialized in cooke {name, accessToken, refreshToken}
 * @returns {Q.Promise|Boolean}
 */
Db.prototype.emailConfirmed = function (mUser) {
    var deferred = Q.defer();
    User.findOne({'_id': mUser._id}, function (err, user) {
        if (err) {
            console.log(err);
        }
        deferred.resolve(user !== null && user.email.confirmed === true);
    });
    return deferred.promise;
};

/**
 * Inserts an email address for the associating user.
 * @param user
 * @param email
 */
Db.prototype.addEmail = function (user, emailAddress) {
    var deferred = Q.defer();
    User.update({'_id': user._id}, {'email': {address: emailAddress, confirmed: false}}, function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

/**
 * Removes an email address for the associated user
 * @param user
 */
Db.prototype.removeEmail = function (user) {
    var deferred = Q.defer();
    User.update({'_id': user._id}, {$unset: {'email': 1}}, function (err) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

/**
 * Confirm a user's email address by checking if the confirmation code passed by the client matches
 * the one in the database.
 * @param user
 * @param confirmCode
 */
Db.prototype.confirmEmail = function (user, confirmCode) {
    var deferred = Q.defer();
    User.findOne({'_id': user._id}, function (err, user) {
        if (err) {
            deferred.reject(err);
        } else if (user.email.confirm_code !== confirmCode) {
            deferred.reject('confirmation codes do not match!');
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

/**
 * Serializes a confirmation code for the user
 * @returns {Q.Promise}
 */
Db.prototype.setConfirmCode = function (user, confirmCode) {
    var deferred = Q.defer();
    User.update({'_id': user._id}, {'email.confirm_code': confirmCode}, function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

/**
 * queries for a user by the specified email and unsets the field
 * @param email
 * @returns {Q.Promise<T>}
 */
Db.prototype.unsubscribeEmail = function (email) {
    var deferred = Q.defer();
    User.update({'email.address': email}, {$unset: {'email': 1}}, function (err) {
        if (err) {
            console.log(err);
            deferred.reject();
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};
module.exports = Db;