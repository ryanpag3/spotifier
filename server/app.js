/**
 * Created by dev on 7/17/2017.
 */
var SpotifyWebApi = require('spotify-web-api-node');
/*
    handle middleware
 */
const setupApp = function(app, express) {
    // add application credentials
    var spotifyApi = new SpotifyWebApi({
        clientId: '180cc653f1f24ae9864d5d718d68f3c6',
        clientSecret: '7e3b3a161dc6442f974655a3209505cd',
        redirectUri: 'http://localhost:3000/callback'
    });
};

module.exports = setupApp;
