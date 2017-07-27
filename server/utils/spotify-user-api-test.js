var SpotifyApi = require('spotify-web-api-node');
var credentials = {
    clientID: '180cc653f1f24ae9864d5d718d68f3c6',
    clientSecret: '7e3b3a161dc6442f974655a3209505cd',
    redirectUri: 'http://localhost:3000/user/callback'
};


var users = {};

var self = module.exports = {
    saveTokens: function(userId, accessToken, refreshToken) {
        users[userId] = {accessToken: accessToken, refreshToken: refreshToken};
    },

    getSavedArtists: function(userId) {

    }

};

