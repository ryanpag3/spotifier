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
                done();
            }
        });

}

queue.process('sync-library', 1, function(job, done) {
    var i = 0;
    /* Get all unique artists in user's saved tracks library */
    spotifyApiUser.getLibraryArtists(job.data.user)
        .then(function(artists) {
            // var names = [];
            // for (var i = 0; i < artists.length; i++){
            //     names.push(artists[i].artistName);
            // }
            // names.sort();
            // for (var i = 0; i < names.length; i++){
            //     console.log(names[i]);
            // }

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
    create: function(data, done) {
        syncLibrary(data, done);
    }
};