var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/**
 * USER MODEL SCHEMA
 */
var User = new Schema({
    name: {type: String, required: true},
    email: {
        address: String,
        confirmed: Boolean,
        confirm_code: String
    },
    refresh_token: String,
    saved_artists: [Schema.ObjectId],
    new_releases: [Schema.ObjectId],
    playlist: {
        id: String,
        snapshot_id: String
    },
    sync_queue: {
        id: Number,
        status: String
    }
});

module.exports = mongoose.model('users', User);