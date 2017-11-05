/** testing out different job queue module due to ability to globally pause queue **/
var Queue = require('bull'),
    cluster = require('cluster'),
    path = require('path'),
    spotifyApiServer = require('../utils/spotify-server-api'),
    Db = require('./db');
var socketUtil;

var artistDetailsQueue = new Queue('artist-details'); // todo add prod redis values

/**
 * This gets run for each job. 2 is the concurrency for the job, so we run 2 at a time. Job is
 * an object with identifying information. Done is a callback.
 */
artistDetailsQueue.process(2, function (job, done) {
    spotifyApiServer.getRecentRelease(job.data.artist)
        .then(function (album) {
            var artist;
            if (album) {
                artist = {
                    spotify_id: job.data.artist.spotify_id,
                    recent_release: {
                        id: album.id,
                        uri: album.uri,
                        title: album.name,
                        release_date: album.release_date,
                        images: album.images,
                        url: album.external_urls.spotify
                    }
                };
            } else {
                artist = {
                    spotify_id: job.data.artist.spotify_id,
                    recent_release: {
                        title: 'No albums currently on Spotify',
                        release_date: '-'
                    }
                }
            }
            // return updated artist info
            done(null, artist);
        })
        .catch(function (err) {
            console.log(err);
            done(new Error(err));
        })
});

/**
 * Job event listeners.
 */
artistDetailsQueue
    .on('error', function (err) {
        console.log(err);
    })
    .on('failed', function (job, err) {
        console.log('get artist details job failed, restarting...');
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
            console.log('the artist details queue is now paused...');
        })
    },

    resume: function () {
        artistDetailsQueue.resume().then(function () {
            console.log('get artist details queue has been resumed...');
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