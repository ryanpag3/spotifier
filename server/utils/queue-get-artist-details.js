/** testing out different job queue module due to ability to globally pause queue **/
var Queue = require('bull'),
    cluster = require('cluster'),
    path = require('path'),
    spotifyApiServer = require('../utils/spotify-server-api'),
    Db = require('./db'),
    logger = require('./logger')
    SpotifyAPI = require('./spotify-api');
var socketUtil;

var artistDetailsQueue = new Queue('artist-details'); // todo add prod redis values
let spotAPI = new SpotifyAPI();

/**
 * This gets run for each job. 2 is the concurrency for the job, so we run 2 at a time. Job is
 * an object with identifying information. Done is a callback.
 */
artistDetailsQueue.process(2, async function (job, done) {
    try {
        // console.log(job.data.artist);
        const artist = await spotAPI.getArtistNewRelease(job.data.artist.spotify_id);
        done(null, artist);
    } catch (e) {
        done(new Error(e));
    }
});

/**
 * Job event listeners.
 */
artistDetailsQueue
    .on('error', function (err) {
        logger.error(err);
    })
    .on('failed', function (job, err) {
        logger.info('get artist details job failed, restarting...');
    })
    .on('completed', function (job, result) {
        if (socketUtil) {
            socketUtil.alertArtistDetailsChange(result);
        }
        var db = new Db();
        db.updateArtist(result);
    });


module.exports = {
    createJob: function (artist) {
        artistDetailsQueue.add({artist: artist}, {
            attempts: 20
        });
    },

    pause: function () {
        artistDetailsQueue.pause().then(function () {
            logger.info('the artist details queue is now paused...');
        })
    },

    resume: function () {
        artistDetailsQueue.resume().then(function () {
            logger.info('get artist details queue has been resumed...');
        })
    },

    pauseNoLogging: function() {
        artistDetailsQueue.pause().then(function() {
            // do nothing
        });
    },

    resumeNoLogging: function() {
        artistDetailsQueue.resume().then(function() {
            // do nothing
        });
    },

    /**
     * this is run on startup to expose the socket utility to the queue service
     * @param mSocketUtil
     */
    setSocketUtil: function (mSocketUtil) {
        socketUtil = mSocketUtil;
    }
};