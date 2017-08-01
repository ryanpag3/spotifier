var express = require('express'),
    router = express.Router(),
    jobQueue = require('../utils/job-queue.js');

router.post('/search', function(req, res) {
    var data = {user: req.user, query: req.body.query};
    jobQueue.createSearchArtistJob(data, function(result) {
            return res.status(200).json({
                result: result
            });
    });
});

module.exports = router;