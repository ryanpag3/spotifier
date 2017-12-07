var express = require('express'),
    Q = require('q'),
    router = express.Router(),
    SpotifyApiUser = require('../utils/spotify-user-api.js'),
    scanner = require('../utils/new-releases.js'),
    logger = require('../utils/logger');

router.post('/search', function(req, res) {
    var spotifyApiUser = new SpotifyApiUser();
    // used for high concurrency
    // var data = {user: req.user, query: req.body.query};
    // jobQueue.createSearchArtistJob(data, function(result) {
    //         return res.status(200).json({
    //             result: result
    //         });
    // });
    refreshAccessToken(req.user)
        .then(function(accessToken){
            if (accessToken){
                // serialize new user token
                req.session.passport.user.accessToken = accessToken;
                req.session.save(function(err){
                    // catch serialization error
                    if (err) {
                        logger.error(err);
                    }
                });
            }
            spotifyApiUser.searchArtists(req.user, req.body.query)
                .then(function(result) {
                    return res.status(200).json({
                        result: result
                    })
                })
                .catch(function(err) {
                    logger.error(err);
                })
        })
        // catch refresh access token api error
        .catch(function(err) {
            logger.error(err);
        });
});

router.get('/scan', function(req, res) {
    scanner.startScan();
    res.status(200).send();
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