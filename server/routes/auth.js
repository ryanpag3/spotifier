/**
 * Created by ryan on 7/18/2017.
 */
var express = require('express'),
    passport = require('passport'),
    spotifyApi = require('../utils/spotifyUserApi.js');
    router = express.Router();

router.get('/login', passport.authenticate('spotify', {scope: ['user-read-private', 'user-read-email', 'user-library-read', 'user-library-modify'], showDialog: true}),
    // callback function
    function(req, res) {
        // this request redirects to spotify so it wont be called
    });

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
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
        res.redirect('/');
});



module.exports = router;



