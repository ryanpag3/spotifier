/**
 * Created by ryan on 7/18/2017.
 */
var express = require('express'),
    passport = require('passport'),
    Db = require('../utils/db-wrapper.js'),
    router = express.Router();

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
    passport.authenticate('spotify', {failureRedirect: '/'}),
    function(req, res) {
        var db = new Db();
        // creates new user object in db if it doesn't already exist
        db.createUser(req.user)
            .then(function() {
                // todo
            })
            .catch(function(err) {
                // todo
            });
        // if user has not setup their email, route to email entry page
        // if  user has not confirmed their email, route to confirmation send page
        // else route to library page
        // if (!userDb.emailExists(username)) {
        //     res.redirect('/enter-email');
        // }
        // else if (!userDb.emailConfirmed(username)) {
        //     res.redirect('/confirm-email');
        // }
        // else {
        //     res.redirect('/library');
        // }

        // DEBUGGING
        res.redirect('/library');
});

/**
 * API endpoint for inserting a user's email into the database.
 * todo
 */
router.post('email/add', function(req, res) {

});

/**
 * API endpoint for deleting a user's email from the database.
 * todo
 */
router.post('email/delete', function(req, res) {

});

/**
 * API endpoint for updating a user's email in the database.
 * todo
 */
router.post('email/update', function(req, res) {

});

/**
 * API endpoint for confirming a user's email in the database.
 * todo
 */
router.post('email/confirm', function(req, res) {

});

/**
 * API endpoint for getting a user's email authentication status.
 * todo
 */
router.get('email/status', function(req, res) {

});


module.exports = router;



