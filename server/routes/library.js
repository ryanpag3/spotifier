/**
 * This RESTful api handles adding and removing artists from a users library. On authentication, a get request will send
 * a users saved library to the client for updating the UI. When a user searches and adds an artist, it will handle
 * adding the artist to the db, and likewise for removing artists.
 */

var express = require('express'),
    router = express.Router(),
    spotifyApi = require('../utils/spotifyUserApi'),
    User = require('../models/user.js');

router.get('/update', function(req, res) {
    spotifyApi.getSavedTracks()
        .then(function(data) {
            res.sendStatus(200);
        });
});

/**
 *
 */
router.get('/sync', function(req, res) {

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


