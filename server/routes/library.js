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
        .then(function(){
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
    var db = new Db();
    // add artist for user
    db.addArtist(req.user, req.body.artist)
        // on success
        .then(function() {
            console.log('sending success...');
            res.status(200).send();
        })
        // on failure
        .catch(function(err) {
            console.log('sending failure...');
            return res.status(500).json({
                err: err
            })
        });
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


