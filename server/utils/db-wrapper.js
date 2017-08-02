/**
 *  This file provides wrapper functions for managing the user mongodb collection.
 */
var Q = require('q'),
    User = require('../models/user.js'),
    Artist = require('../models/artist.js'),
    jobQueue = require('../utils/job-queue.js');

var self = module.exports = {
    createUser: function (user) {
        var deferred = Q.defer();
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
    },

    /** add artist to user library **/
    addArtist: function(user, artist) {
        var deferred = Q.defer();
        // query for user
        User.findOne({'name' : user.name}, function(err, user) {
            if (err) {
                console.log(err);
            }
            // if user does not exist
            if (user === null) {
                // create user and start over
                self.createUser(user)
                    .then(function() {
                        self.addArtist(user, artist);
                    })
            } else {
                // query for artist
                Artist.findOne({'spotify_id' : artist.spotifyId}, function(err, artist) {
                    // if exists in db
                    if (artist !== null) {
                        self.assignArtist(user, artist);
                    } else {
                        // create new artist entry in db
                        self.createArtist(artist)
                            .then(function() {
                                // assign user to artist
                                self.assignArtist(user, artist);
                            })
                            .catch(function(err) {
                                console.log(err);
                            })
                    }
                })
            }
        });


    },

    /** create new artists in database **/
    createArtist: function(artist) {
        var deferred = Q.defer();
        var artist = new Artist({
            spotify_id: artist.spotifyId,
            name: artist.name,
            recent_release: {
                title: 'request sent to spotify, pending...' // placeholder
            }
        }).save(function(err, artist) {
            if (err) {
               deferred.reject(err);
            }
            jobQueue.createGetArtistDetailsJob({artist: artist}, function() {
                // queue up get artist details job
                // todo: handle callback
            });
            deferred.resolve();
        });

        return deferred.promise();
    },

    /** assign an artist to a user and vice versa **/
    assignArtist: function(user, artist) {
        var deferred = Q.defer();
        User.findOne({'name' : user.name}, function(err, user) {
            if (err) {
                deferred.reject(err);
            }

            // query for artist
            Artist.findOne({'spotify_id' : artist.spotifyId}, function(err, artist) {
                if (err) {
                    deferred.reject(err);
                }
                // we don't need to check if artist exists because we do it in calling function
                // assign user to artist if they arent already
                if (!self.artistTrackingUser(artist._id, user._id)) {
                    artist.users_tracking.push(user._id);
                    artist.save(function(err) {
                        deferred.reject(err);
                    })
                }

                // assign artist to user if they aren't already
                if (!self.userTrackingArtist(artist._id, user._id)) {
                    user.saved_artists.push(artist._id);
                    user.save(function(err) {
                        deferred.reject(err);
                    })
                }
            })
        });
        return deferred.promise;
    },




    // addArtist: function (username, artistId) {
    //     // query for user
    //     User.findOne({'name': username}, function (err, user) {
    //         if (err) {
    //             console.log(err);
    //         }
    //         // check if user exists
    //         if (user === null) {
    //             console.log('ERROR: user not found in db.')
    //         } else {
    //             // query for artist
    //             Artist.findOne({'spotify_id': artistId}, function (err, artist) {
    //                 if (err) {
    //                     console.log(err);
    //                 }
    //                 // check if artist exists
    //                 if (artist === null) {
    //                     // get artist album information
    //                     spotifyApi.getRecentRelease(artistId)
    //                         .then(function (album) {
    //                             // insert artist into db
    //                             var artist = new Artist({
    //                                 spotify_id: artistId,
    //                                 name: album.artists[0].name,
    //                                 recent_release: {
    //                                     id: album.id,
    //                                     title: album.name,
    //                                     release_date: album.release_date,
    //                                     images: album.images
    //                                 }
    //                             })
    //                                 .save(function (err, artist) {
    //                                     if (err) {
    //                                         console.log(err);
    //                                     }
    //                                     artist.users_tracking.push(user._id);
    //                                     artist.save(function (err) {
    //                                         if (err) {
    //                                             console.log(err);
    //                                         }
    //                                     });
    //                                     // associate artist with user
    //                                     user.saved_artists.push(artist._id);
    //                                     user.save(function (err) {
    //                                         if (err) {
    //                                             console.log(err);
    //                                         }
    //
    //                                     });
    //                                     console.log(artist.name + ' added and associated with ' + user.name);
    //                                 })
    //                         })
    //                         .catch(function (err) {
    //                             console.log(err);
    //                         })
    //                 } else {
    //                     if (!self.artistTrackingUser(artist._id, user._id)) {
    //                         // associate user with artist
    //                         artist.users_tracking.push(user._id);
    //                         artist.save(function (err) {
    //                             if (err) {
    //                                 console.log(err);
    //                             }
    //                         });
    //                         console.log(artist.name + ' added ' + user.name + ' to tracking list.');
    //                     }
    //                     if (!self.userTrackingArtist(artist._id, user._id)){
    //                         // associate artist with user
    //                         user.saved_artists.push(artist._id);
    //                         user.save(function (err) {
    //                             if (err) {
    //                                 console.log(err);
    //                             }
    //                         });
    //                         console.log(user.name + ' associated with ' + artist.name);
    //                     }
    //
    //                 }
    //             })
    //         }
    //     })
    // },

    removeArtist: function (username, artistId) {

    },
    /**
     * retrieves the user's library from the db
     * @param username
     */
    getLibrary: function(username) {
        var deferred = Q.defer();
        User.findOne({'name' : username}, function(err, user) {
          var artistIds = user.saved_artists;
          Artist.find({'_id' : artistIds}, function(err, artists) {
              deferred.resolve(artists);
          })
        });
        return deferred.promise;
    },

    /**
     * checks if an artist is already tracking a user
     * @param artistId: mongo _id of artist
     * @param userId: mongo _id of user
     */
    artistTrackingUser: function (artistId, userId) {
        Artist.findOne({'_id': artistId}, {'users_tracking': userId}, function (err, artist) {
            if (err) {
                console.log(err);
            }
            return artist !== null;
        })
    },

    /**
     * checks if a user is already tracking an artist
     * @param artistId: mongo _id of artist
     * @param userId: mongo _id of user
     */
    userTrackingArtist: function (artistId, userId) {
        User.findOne({'_id': userId}, {'saved_artists': artistId}, function (err, user) {
            if (err) {
                console.log(err);
            }
            return user !== null;
        })
    },

    userExists: function (username) {
        User.findOne({'username': username}, function (err, user) {
            if (err) {
                console.log(err);
            }
            return user !== null;
        })
    },

    emailExists: function (username) {
        User.findOne({'username': username}, function (err, user) {
            if (err) {
                console.log(err);
            }
            return user !== null && user.email.address !== null;
        })
    },

    emailConfirmed: function (username) {
        User.findOne({'username': username}, function (err, user) {
            if (err) {
                console.log(err);
            }
        });
        return user !== null && user.email.confirmed === true;
    }
};