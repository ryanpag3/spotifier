var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    username: String,
    saved_artists: [{spotify_id: String, name: String, recent_release: {title: String, date: Date}}]
});