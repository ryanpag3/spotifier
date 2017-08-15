var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/**
 * USER MODEL SCHEMA
 * username: this is the unique spotify id
 * saved_artist_ids: this is an array of mongo IDs for each artist saved
 * new_releases: this is an array of mongo IDs of artists who have new releases found
 */
var User = new Schema({
    name: {type: String, required: true},
    email: {
        address: String,
        confirmed: Boolean,
        confirm_code: String
    },
    saved_artists: [Schema.ObjectId],
    new_releases: [Schema.ObjectId],
    sync_queue: {
        id: Number,
        status: String
    }
});

module.exports = mongoose.model('users', User);