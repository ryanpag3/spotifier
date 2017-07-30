/**
 * This RESTful api handles adding and removing artists from a users library. On authentication, a get request will send
 * a users saved library to the client for updating the UI. When a user searches and adds an artist, it will handle
 * adding the artist to the db, and likewise for removing artists.
 */

var express = require('express'),
    router = express.Router(),
    syncQueue = require('../utils/sync-queue.js'),
    artistDb = require('../utils/db-artist-wrapper.js'),
    userDb = require('../utils/db-user-wrapper.js');

/**
 * When a user hits enter on the search bar, this page will call the spotifyApi service,
 * and route the page to display the search results.
 */
router.post('/search', function(req, res) {
   // TODO
});

router.get('/update', function(req, res) {
    // TODO
});

/**
 * This will sync the users library artists with the database, and return an updated list
 * for the client.
 */
router.get('/sync', function(req, res) {
    console.log('sync called...');

    if (req.user === undefined) {
        console.log('req.user === undefined');
        res.redirect('/library');
    } else {
        var data = {user: req.user, artists: req.body.artists};
        syncQueue.create(data, function() {
            // do nothing
        });
       res.redirect('/library');
    }


});

router.post('/add', function(req, res) {
   // todo
   // handles adding an artist to the users library
});

router.get('/remove', function(req, res) {
   // todo
   // handles removing an artist from the users library
});

module.exports = router;


