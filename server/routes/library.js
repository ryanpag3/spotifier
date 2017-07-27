/**
 * This RESTful api handles adding and removing artists from a users library. On authentication, a get request will send
 * a users saved library to the client for updating the UI. When a user searches and adds an artist, it will handle
 * adding the artist to the db, and likewise for removing artists.
 */

var express = require('express'),
    router = express.Router(),
    spotifyApi = require('../utils/spotify-user-api-test'),
    User = require('../models/user.js');

/**
 * When a user hits enter on the search bar, this page will call the spotifyApi service,
 * and route the page to display the search results.
 */
router.post('/search', function(req, res) {
    // spotifyApi.search(req.body.artistName)
    //     .then(function(data) {
    //         console.log(data.body.artists.items);
    //     })
    //     .catch(function(err){
    //         console.log(err);
    //     })
});

router.get('/update', function(req, res) {
    // spotifyApi.getSavedTracks()
    //     .then(function(data) {
    //         for (var i = 0; i < 1; i++) {
    //             console.log(data[i]);
    //         }
    //         res.sendStatus(200);
    //     });
});

/**
 * This will sync the users library artists with the database, and return an updated list
 * for the client.
 */
router.get('/sync', function(req, res) {
    spotifyApi.getSavedArtists(req.user.id);
    return res.status(200).json({
        msg: 'OK'
    });
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


