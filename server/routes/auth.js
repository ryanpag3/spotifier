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
            .then(function(user) {
                // save the database id in the cookie
                req.session.passport.user._id = user._id;
                req.session.save(function(err) {
                    if (err) {
                        console.log(err);
                    }
                });
                console.log(user);

                db.emailExists(user)
                    .then(function(exists) {
                        // if user has not entered an email
                        if (!exists) {
                            res.redirect('/email');
                        } else {
                            db.emailConfirmed(user)
                                .then(function(confirmed) {
                                    // if user has not confirmed their email
                                    if(!confirmed) {
                                        console.log('/redirect to confirmation page')
                                    }
                                })
                        }
                    })
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

        // // DEBUGGING
        // res.redirect('/library');
});

/**
 * API endpoint for inserting a user's email into the database.
 * todo
 */
router.post('/email/add', function(req, res) {
    var db = new Db();
    console.log(req.body.emailAddress);
    db.addEmail(req.user, req.body.emailAddress)
        .then(function() {

        })

});

/**
 * API endpoint for deleting a user's email from the database.
 * todo
 */
router.post('email/delete', function(req, res) {
    //removeEmail
});

/**
 * API endpoint for updating a user's email in the database.
 * todo
 */
router.post('email/update', function(req, res) {
    // add email
});

router.get('email/send-confirmation', function(req, res) {
    // queue confirmation email job
});

/**
 * API endpoint for confirming a user's email in the database.
 * todo
 */
router.get('email/confirm/', function(req, res) {
    // parse query parameters and validate code
});

/**
 * API endpoint for getting a user's email authentication status.
 * todo
 */
router.get('email/status', function(req, res) {
    // return status of email
    // email is either
    // undefined
    // defined but not confirmed
    // defined and confirmed
});


module.exports = router;



