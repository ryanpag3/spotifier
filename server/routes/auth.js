/**
 * Created by ryan on 7/18/2017.
 */
var express = require('express'),
    passport = require('passport'),
    router = express.Router();

router.get('/login', passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private'], showDialog: true}),
    // callback function
    function(req, res) {
        // do nothing
    });

router.post('/logout', function(req, res) {
    // TODO
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

module.exports = router;



