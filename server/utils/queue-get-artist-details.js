/** testing out different job queue module due to ability to globally pause queue **/
var Queue = require('bull'),
    cluster = require('cluster'),
    path = require('path'),
    spotifyApiServer = require('../utils/spotify-server-api'),
    Db = require('../utils/db-wrapper');

var artistDetailsQueue = new Queue('artist-details'); // todo add prod redis values

/**
 * This gets run for each job. 2 is the concurrency for the job, so we run 2 at a time. Job is
 * an object with identifying information. Done is a callback.
 */
artistDetailsQueue.process(2, function (job, done) {
    spotifyApiServer.getRecentRelease(job.data.artist)
        .then(function (album) {
            // parse album results
            var artist = {
                spotify_id: job.data.artist.spotify_id,
                recent_release: {
                    id: album.id,
                    title: album.name,
                    release_date: album.release_date,
                    images: album.images
                }
            };

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
        var db = new Db();
        db.updateArtist(result);
        console.log('artist details gotten.')
    });


module.exports = {
    createJob: function (artist) {
        artistDetailsQueue.add(artist, {
            attempts: 3
        });
    },

    pause: function () {
        artistDetailsQueue.pause().then(function () {
            console.log('the artist details queue is now paused...');
        })
    },

    resume: function () {
        artistDetailsQueue.resume().then(function () {
            console.log('get artist details queue has been resume...');
        })
    }
};