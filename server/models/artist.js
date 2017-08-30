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
    spotify_id: {type: String, required: true},
    name: {type: String, required: true},
    recent_release: {type: {
        id: String,
        title: String,
        release_date: String,
        display_date: String,
        images: [],
        url: String
    }, required: true},
    users_tracking: [Schema.ObjectId]
});

module.exports = mongoose.model('artists', Artist);