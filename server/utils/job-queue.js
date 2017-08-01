var kue = require('kue'),
    queue = kue.createQueue(),
    artistDb = require('../utils/db-artist-wrapper.js'),
    user = require('../utils/db-user-wrapper.js'),
    spotifyApiUser = require('../utils/spotify-user-api');

// create event and specify event handlers
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
// sync library job process
queue.process('sync-library', 1, function(job, done) {
    var i = 0;
    /* Get all unique artists in user's saved tracks library */
    spotifyApiUser.getLibraryArtists(job.data.user)
        .then(function(artists) {
            console.log('inserting them into the db');
            function go() {
                // insert them into the database
                user.addArtist(job.data.user.id, artists[i++].artistId);

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

function searchArtist(data, done) {
    var job = queue.create('search-artist', data);
    job.on('start', function() {
        // todo
    }).on('complete', function(res) {
        done(res);
    })
        .removeOnComplete(true)
        .save(function(err) {
            if (err) {
                done(err);
            }
        })
}

queue.process('search-artist', 1, function(job, done) {
    spotifyApiUser.searchArtists(job.data.user, job.data.query)
        .then(function(res) {
            done(null, res);
        })
        .catch(function(err) {
            done(err, null);
        });
});



module.exports = {
    // data = {user: req.user, artists: req.body.artists};
    createSyncLibJob: function(data, done) {
        syncLibrary(data, done);
    },

    // data = {user: req.user, query: req.body.query};
    createSearchArtistJob: function(data, done) {
        searchArtist(data, done);
    }



};