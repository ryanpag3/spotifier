/**
 *  This file provides wrapper functions for managing the user mongodb collection.
 */
var Q = require('q'),
    User = require('../models/user.js'),
    Artist = require('../models/artist.js'),
    spotifyApi = require('../utils/spotify-server-api.js');

var self = module.exports = {
    createUser: function (username) {
        User.findOne({'name': username}, function (err, user) {
            if (err) {
                console.log(err);
            }
            // check if exists
            if (user === null) {
                var user = new User({
                    name: username
                }).save(function (err, user) {
                    console.log(user);
                });
            } else {
                console.log(user);
            }
        })
    },

    addArtist: function (username, artistId) {
        // query for user
        User.findOne({'name': username}, function (err, user) {
            if (err) {
                console.log(err);
            }
            // check if user exists
            if (user === null) {
                console.log('ERROR: user not found in db.')
            } else {
                // query for artist
                Artist.findOne({'spotify_id': artistId}, function (err, artist) {
                    if (err) {
                        console.log(err);
                    }
                    // check if artist exists
                    if (artist === null) {
                        // get artist album information
                        spotifyApi.getRecentRelease(artistId)
                            .then(function (album) {
                                // insert artist into db
                                var artist = new Artist({
                                    spotify_id: artistId,
                                    name: album.artists[0].name,
                                    recent_release: {
                                        id: album.id,
                                        title: album.name,
                                        release_date: album.release_date,
                                        images: album.images
                                    }
                                })
                                    .save(function (err, artist) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        artist.users_tracking.push(user._id);
                                        artist.save(function (err) {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                        // associate artist with user
                                        user.saved_artists.push(artist._id);
                                        user.save(function (err) {
                                            if (err) {
                                                console.log(err);
                                            }

                                        });
                                        console.log(artist.name + ' added and associated with ' + user.name);
                                    })
                            })
                            .catch(function (err) {
                                console.log(err);
                            })
                    } else {
                        if (!self.artistTrackingUser(artist._id, user._id)) {
                            // associate user with artist
                            artist.users_tracking.push(user._id);
                            artist.save(function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                        if (!self.userTrackingArtist(artist._id, user._id)){
                            // associate artist with user
                            user.saved_artists.push(artist._id);
                            user.save(function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                        console.log(user.name + ' associated with ' + artist.name);
                    }
                })
            }
        })
    },

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