/**
 * This RESTful api handles adding and removing artists from a users library. On authentication, a get request will send
 * a users saved library to the client for updating the UI. When a user searches and adds an artist, it will handle
 * adding the artist to the db, and likewise for removing artists.
 */

var express = require('express'),
    Q = require('q'),
    router = express.Router(),
    SpotifyApiUser = require('../utils/spotify-user-api-fixed.js'),
    Db = require('../utils/db-wrapper.js'),
    jobQueue = require('../utils/job-queue.js');

/* handles searching a user's saved artists */
router.post('/search', function(req, res) {
   // TODO
});

router.get('/update', function(req, res) {
    var db = new Db();
    db.getLibrary(req.user.name)
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
    refreshAccessToken(req.user)
        .then(function(accessToken){
            if (accessToken){
                req.session.passport.user.accessToken = accessToken;
                req.session.save(function(err) {
                    if (err){
                        console.log(err);
                    }
                });
            }
            jobQueue.createSyncLibJob({user: req.user}, function() {
                // todo job queue callback
                console.log('sync library job done...');
            });
        })
        // catch refresh access token error
        .catch(function(err) {
            console.log(err);
        });
    res.redirect('/library');
});

router.post('/add', function(req, res) {
   // todo
   // handles adding an artist to the users library
});

router.get('/remove', function(req, res) {
   // todo
   // handles removing an artist from the users library
});

router.get('/me', function(req, res) {
    return res.status(200).json({
        user: req.user
    })
});

/** HELPER FUNCTIONS **/
// refreshes user access token if expired or missing
function refreshAccessToken(user) {
    var api = new SpotifyApiUser(),
        deferred = Q.defer();
    api.getAccessToken(user)
        .then(function(accessToken) {
            if (accessToken){
                deferred.resolve(accessToken);
            } else {
                deferred.resolve();
            }
        })
        .catch(function(err) {
            deferred.reject(err);
        });
    return deferred.promise;
}

module.exports = router;


