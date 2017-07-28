var mongoose = require('mongoose');
var Schema = mongoose.Schema;
/**
 * ARTIST MODEL SCHEMA
 * spotify_id: this is the unique artist identifier for spotify
 * name: this is the artist's name
 * recent_release: this is the information for the artist's most recent release
 * users_tracking: this is an array of mongodb IDs used for handling emails
 */
var Artist = new Schema({
    spotify_id: String,
    name: String,
    recent_release: {
        id: String,
        title: String,
        release_date: String,
        images: []
    },
    users_tracking: [String]
});

module.exports = mongoose.model('artists', Artist);