/** testing out different job queue module due to ability to globally pause queue **/
var Queue = require('bull'),
    spotifyApiServer = require('../utils/spotify-server-api'),
    Db = require('../utils/db-wrapper');

var artistDetailsQueue = new Queue('artist-details'); // todo add prod redis values

// job.data contains job data
artistDetailsQueue.process(function (job, done) {
    spotifyApiServer.getRecentRelease(job.data.artist)
        .then(function (album) {
            done(null, album);
        })
        .catch(function (err) {
            console.log(job.data.artist);
            done(new Error(err));
        })
});

artistDetailsQueue
    .on('error', function (err) {
        console.log('get artist details job error: ' + err);
    })
    .on('completed', function (job, result) {
        var db = new Db();
        console.log('successfully retrieved information for: ' + result.artists[0].name);
        // assign album information once job has been processed
        var artist = {
            spotify_id: result.artists[0].id,
            recent_release: {
                id: result.id,
                title: result.name,
                release_date: result.release_date,
                images: result.images
            }
        };
        db.updateArtist(artist);
    });

module.exports = {
    createJob: function (artist) {
        artistDetailsQueue.add(artist, {

        });
    },

    pause: function () {
        artistDetailsQueue.pause().then(function () {
            console.log('the queue is now paused...');
        })
    },

    resume: function () {
        artistDetailsQueue.resume().then(function () {
            console.log('get artist details queue has been resume...');
        })
    }
};