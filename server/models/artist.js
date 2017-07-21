var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Artist = new Schema({
   spotify_id: String,
   name: String,
   users_tracking: [String]
});