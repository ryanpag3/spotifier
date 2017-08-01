var Artist = require('../models/artist.js'),
    spotifyApi = require('../utils/spotify-server-api.js'),
    Q = require('q');
/**
 * This is a wrapper module for handling the logic for the mongoDB artist collection.
 */

var self = module.exports = {
    create: function(artistId) {
        var deferred = Q.defer();

        // query database for existing artist information
        Artist.findOne({'spotify_id' : artistId}, function(err, artist) {
            if (err) {
                console.log(err);
            }

            // if artist does not exist
            if (artist === null) {
                // get artist album information
                spotifyApi.getRecentRelease(artistId)
                    .then(function(album) {
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
                            .save(function(err, artist) {
                                if (err) {
                                    console.log(err);
                                }
                                console.log(artist.name + ' added.');
                                deferred.resolve(artist._ID);
                            })
                    })
                    .catch(function(err) {
                        console.log(err);
                        deferred.reject(err);
                    })
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    },
    /** get an artist's info by their _ID **/
    get: function(id) {

    },

    /** returns true if the artist exists in the db **/
    exists: function(spotifyId) {
        // var deferred = Q.defer();
        Artist.findOne({'spotify_id' : spotifyId}, function(err, artist) {
            if (err) {
                console.log(err);
            }
            return artist !== null;
        });
    },

    /**
     * associates user to artist for tracking
     * @param userId: mongo ObjectId of user
     * @param spotifyId: spotify_id of artist
     */
    addUser: function(spotifyId, userId) {
        Artist.findOne({'spotify_id' : spotifyId}, function(err, artist) {
            if (err) {
                console.log(err)
            }
            else if (artist === null) {
                console.log('ERROR: ARTIST NOT FOUND...');
            }
            else {
                artist.users_tracking.push(userId);
            }

        })
    }
};