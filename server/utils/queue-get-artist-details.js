/** testing out different job queue module due to ability to globally pause queue **/
var Queue = require('bull'),
    spotifyApiServer = require('../utils/spotify-server-api'),
    Db = require('../utils/db-wrapper');

var artistDetailsQueue = new Queue('artist-details'); // todo add prod redis values

// job.data contains job data
artistDetailsQueue.process(function (job, done) {
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
            console.log('********************');
            console.log(job.data.artist);
            console.log('********************');
            done(new Error(err));
        })
});

artistDetailsQueue
    .on('error', function (err) {
        console.log(err);
    })
    .on('completed', function (job, result) {
        var db = new Db();
        db.updateArtist(result);
    });

module.exports = {
    createJob: function (artist) {
        if (artist === undefined) {
            console.log('ARTIST UNDEFINED!!!');
        }
        artistDetailsQueue.add(artist);
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