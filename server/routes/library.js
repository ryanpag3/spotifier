/**
 * This RESTful api handles adding and removing artists from a users library. On authentication, a get request will send
 * a users saved library to the client for updating the UI. When a user searches and adds an artist, it will handle
 * adding the artist to the db, and likewise for removing artists.
 */

var express = require('express'),
    passport = require('passport'),
    Q = require('q'),
    router = express.Router(),
    SpotifyApiUser = require('../utils/spotify-user-api.js'),
    Db = require('../utils/db.js'),
    syncLibraryJobQueue = require('../utils/queue-sync-user-library.js'),
    releaseScanner = require('../utils/new-releases');

/**
 * returns the authenticated user's tracked artist library
 */
router.get('/update', function(req, res) {
    var db = new Db();
    db.getLibrary(req.user)
        .then(function(library) {
            return res.status(200).json({
                library: library
            })
        })
});

/**
 * This will sync the users library artists with the database, and return an updated list
 * for the client.
 */
router.get('/sync', function(req, res) {
    refreshAccessToken(req)
        .then(function() {
            syncLibraryJobQueue.createJob(req.user)
                .catch(function(err) {
                    return res.status(500).json({
                        err: err
                        })
                });
            res.status(200).send();
        })
        .catch(function(err) { // catch refresh access token error
            console.log(err);
        });
});

/**
 * Calls the sync library queue utility to attempt to remove
 * the job for the specified user from the queue.
 */
router.get('/cancel-sync', function(req, res) {
   syncLibraryJobQueue.removeJob(req.user)
       .then(function() {
           res.status(200).send();
       })
       .catch(function(err) {
           return res.status(500).json({
               err: err
           })
       })
});

/**
 * This endpoint returns the current sync queue status for the
 * authenticated user in a JSON object.
 */
router.get('/sync-status', function(req, res) {
    syncLibraryJobQueue.getJobStatus(req.user)
        .then(function(status) {
            return res.status(200).json({
                status: status
            })
        })
        .catch(function(err) {
            return res.status(500).json({
                err: err
            })
        })
});

/**
 * API endpoint for adding an artist for the authenticated user.
 * We retrieve the socket utility object from express middleware,
 * then refresh a user's spotify access token if it has expired,
 * then we get detailed db information for the user, and finally
 * we use the database wrapper to associate the artist with the
 * user.
 */
router.post('/add', function(req, res) {
    var socketUtil = req.app.get('socketio');
    var db = new Db();
    // refresh a users access token if necessary
    refreshAccessToken(req)
        .then(function() {
            // query users collection for user information
            db.getUser(req.user)
                .then(function(user) {
                    // add artist
                    db.addArtist(user, req.body.artist, socketUtil)
                        .then(function() {
                            // return success code
                            res.status(200).send();
                        })
                        .catch(function(err) {
                            // return fail code with error message
                            return res.status(500).json({
                                err: err
                            })
                        });
                })
                .catch(function(err) {
                    // user does not exist in database, redirect to landing page
                    req.redirect('/');
                })
        })
});

/**
 * API endpoint for removing an artist from the database for
 * a specific user. Calls the database wrapper which returns
 * a promise that we use to return a status code.
 */
router.post('/remove', function(req, res) {
    var deferred = Q.defer(),
        db = new Db();
    db.removeArtist(req.user, req.body.artist)
        .then(function() {
            res.status(200).send();
        })
        .catch(function(err) {
            return res.status(200).json({
                err: err
            })
        });
    return deferred.promise;
});

/**
 * API endpoint for returning the currently authenticated
 * user information.
 */
router.get('/me', function(req, res) {
    return res.status(200).json({
        user: req.user
    })
});

/**
 * Expose these routes only if in development mode
 */
if (!process.env.NODE_ENV) {
    router.get('/scan', function(req, res) {
        releaseScanner.startScan(true);
        res.status(200).send();
    });

    router.get('/validate', function(req, res) {
        var db = new Db();
        db.validateArtistDetails();
        res.status(200).send();
    })
}

router.get('/scan', function(req, res) {
    releaseScanner.startScan(false);
    res.status(200).send();
});


/** HELPER FUNCTIONS **/
/**
 * This will refresh an access token for a user if it becomes expired and serialized
 * @param req
 */
function refreshAccessToken(req) {
    var api = new SpotifyApiUser(),
        deferred = Q.defer();
    api.getAccessToken(req.user)
        .then(function(accessToken) {
            if (accessToken){
                // access token was expired, need to refresh
                req.session.passport.user.accessToken = accessToken;
                req.session.save(function(err) {
                    if (err){
                        console.log(err);
                    }
                    deferred.resolve();
                });
                deferred.resolve();
            } else {
                // access token is valid
                deferred.resolve();
            }
        })
        .catch(function(err) {
            deferred.reject(err);
        });
    return deferred.promise;
}

module.exports = router;


