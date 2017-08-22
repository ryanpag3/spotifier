/**
 * This RESTful api handles adding and removing artists from a users library. On authentication, a get request will send
 * a users saved library to the client for updating the UI. When a user searches and adds an artist, it will handle
 * adding the artist to the db, and likewise for removing artists.
 */

var express = require('express'),
    Q = require('q'),
    router = express.Router(),
    SpotifyApiUser = require('../utils/spotify-user-api.js'),
    Db = require('../utils/db-wrapper.js'),
    syncLibraryJobQueue = require('../utils/queue-sync-user-library.js');

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
        // catch refresh access token error
        .catch(function(err) {
            console.log(err);
        });
});

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

router.post('/add', function(req, res) {
    var db = new Db();
    // refresh a users access token if necessary
    refreshAccessToken(req)
        .then(function() {
            // query users collection for user information
            db.getUser(req.user)
                .then(function(user) {
                    // add artist
                    db.addArtist(user, req.body.artist)
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

// todo: handle success and fail cases
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

router.get('/me', function(req, res) {
    return res.status(200).json({
        user: req.user
    })
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


