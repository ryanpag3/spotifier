var Artist = require('../models/artist.js'),
    spotifyApi = require('../utils/spotify-server-api.js');
/**
 * This is a wrapper module for handling the logic for the mongoDB artist collection.
 */

var self = module.exports = {
    insert: function(artistId) {
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
                                console.log(artist.name + ' has been successfully added to the artist master list.');
                            })
                    })
                    .catch(function(err) {
                        console.log(err);
                    })
            }
        })
    },
    /** get an artist's info by their _ID **/
    get: function(id) {

    }
};