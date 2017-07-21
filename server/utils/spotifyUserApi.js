var SpotifyApi = require('spotify-web-api-node');
var credentials = {
    clientID: '180cc653f1f24ae9864d5d718d68f3c6',
    clientSecret: '7e3b3a161dc6442f974655a3209505cd',
    redirectUri: 'http://localhost:3000/user/callback'
};
var spotifyApi = new SpotifyApi(credentials);

module.exports = {
    // takes the access and refresh token provided by passport-spotify and applies it
    setTokens: function(accessToken, refreshToken) {
        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);
    }

    // TODO
    // create wrapper functions for handling importing users saved tracks
    // setup database schema for handling checking artists
    // create a application client ID authorization flow for handling checking db
    // for new releases
};



