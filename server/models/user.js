var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/**
 * USER MODEL SCHEMA
 * username: this is the unique spotify id
 * saved_artist_ids: this is an array of mongo IDs for each artist saved
 * new_releases: this is an array of mongo IDs of artists who have new releases found
 */
var User = new Schema({
    username: String,
    saved_artist_ids: [String],
    new_releases: [String]
});