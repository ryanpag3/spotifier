/**
 * This RESTful api handles adding and removing artists from a users library. On authentication, a get request will send
 * a users saved library to the client for updating the UI. When a user searches and adds an artist, it will handle
 * adding the artist to the db, and likewise for removing artists.
 */

var express = require('express'),
    router = express.Router(),
    spotifyApiUser = require('../utils/spotify-user-api.js'),
    db = require('../utils/db-wrapper.js'),
    jobQueue = require('../utils/job-queue.js'),
    user = require('../utils/db-wrapper.js');

/* handles searching a user's saved artists */
router.post('/search', function(req, res) {
   // TODO
});

router.get('/update', function(req, res) {
    user.getLibrary(req.user.name)
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
    console.log('sync called...');
    jobQueue.createSyncLibJob({user: req.user}, function() {
        console.log('sync library callback, issuing refresh.');
        res.redirect('/library');
    });
    return res.status(200);
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

module.exports = router;


