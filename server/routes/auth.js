/**
 * Created by ryan on 7/18/2017.
 */
var express = require('express'),
    passport = require('passport'),
    SpotifyApi = require('spotify-web-api-node'),
    // spotifyApi = require('../utils/spotify-user-api.js');
    router = express.Router();

var credentials = {
    clientId: '180cc653f1f24ae9864d5d718d68f3c6',
    clientSecret: '7e3b3a161dc6442f974655a3209505cd',
    redirectUri: 'http://localhost:3000/user/callback'
},
    spotifyApi = new SpotifyApi(credentials);

router.get('/login', passport.authenticate('spotify', {
    scope: ['user-read-private', 'user-read-email', 'user-library-read'],
            showDialog: true}),
    // callback function
    function(req, res) {
        // this request redirects to spotify so it wont be called
    });

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});

router.get('/me', function(req, res) {
   return res.status(200).json({
       user: req.user
   })
});

router.post('/status', function (req, res) {
    if (!req.isAuthenticated()) {
        // return forbidden
        return res.status(401).json({
            isAuthenticated: false
        })
    }
    // return success
    return res.status(200).json({
        isAuthenticated: true
    })
});

router.get('/callback',
    passport.authenticate('spotify', {failureRedirect: '/login'}),
    function(req, res) {
        spotifyApi.setAccessToken(req.user.accessToken);
        spotifyApi.setRefreshToken(req.user.refreshToken);
        res.redirect('/library');
});

router.get('/confirm-login', function(req, res) {
    if (req.user !== undefined) {
        spotifyApi.refreshAccessToken()
            .then(function(data) {
                req.user.accessToken = data.body.access_token;
                res.send({user: req.user});
            })
            .catch(function(err) {
                console.log(err);
            });
    }
});



module.exports = router;



