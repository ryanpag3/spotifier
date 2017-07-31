var kue = require('kue'),
    queue = kue.createQueue(),
    artistDb = require('../utils/db-artist-wrapper.js'),
    userDb = require('../utils/db-user-wrapper.js'),
    spotifyApiUser = require('../utils/spotify-user-api');

function syncLibrary(data, done) {
    var job = queue.create('sync-library', data);
        job.on('start', function() {
            console.log('Now syncing ' + data.user.id + '\'s library.')
        }).on('complete', function(){
            console.log(data.user.id + '\'s library has been synced.');
        })
            .removeOnComplete(true)
            .save(function(err) {
            if (err) {
                console.log(err);
                done(err);
            } else {
                queue.activeCount(function(err, total) {
                    console.log(total);
                });
                done();
            }
        });
}

queue.process('sync-library', 1, function(job, done) {
    var i = 0;
    /* Get all unique artists in user's saved tracks library */
    spotifyApiUser.getLibraryArtists(job.data.user)
        .then(function(artists) {
            console.log('inserting them into the db');
            function go() {
                // insert them into the database
                artistDb.insert(artists[i++].artistId);
                if (i < artists.length - 1){
                    setTimeout(go, 225);
                } else {
                    done(); // invoke callback
                }
            }
            go();
        })
        .catch(function(err) {
            console.log(err);
        });
});




module.exports = {
    createSyncLibJob: function(data, done) {
        syncLibrary(data, done);
    }



};