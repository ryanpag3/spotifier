var express = require('express'),
    router = express.Router(),
    spotifyUserApi = require('../utils/spotify-user-api.js'),
    jobQueue = require('../utils/job-queue.js');

router.post('/search', function(req, res) {
    // used for high concurrency
    // todo automatically transition to queue system when rate of searches reaches certain point
    // var data = {user: req.user, query: req.body.query};
    // jobQueue.createSearchArtistJob(data, function(result) {
    //         return res.status(200).json({
    //             result: result
    //         });
    // });

    spotifyUserApi.searchArtists(req.user, req.body.query)
        .then(function(res) {
            return res.status(200).json({
                result: res
            })
        })
});

module.exports = router;