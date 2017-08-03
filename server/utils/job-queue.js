var kue = require('kue'),
    queue = kue.createQueue(),
    artistDb = require('./db-artist-wrapper-DEPRECATED.js'),
    db = require('../utils/db-wrapper.js'),
    spotifyApiUser = require('../utils/spotify-user-api'),
    spotifyApiServer = require('../utils/spotify-server-api.js');

// create event and specify event handlers
function syncLibrary(data, done) {
    var job = queue.create('sync-library', data);
        job.on('start', function() {
            console.log('Now syncing ' + data.user.name + '\'s library.')
        }).on('complete', function(){
            console.log(data.user.name + '\'s library has been synced.');
            done();
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
                db.addArtist(job.data.user, artists[i++]);

                if (i < artists.length - 1){
                    setTimeout(go, 0);
                    // go();
                } else {
                    // set delay to allow for db to catch up
                    done();
                }
            }
            go();
        })
        .catch(function(err) {
            console.log(err);
        });
});

// creates queue job for searching for an artist, used only during high concurrency
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

// creates job for getting detailed artist release information
function getArtistDetails(data, done) {
    var job = queue.create('get-artist-details', data);
    job.on('start', function() {
        // console.log('getting details for ' + data.artist.name);
    }). on ('complete', function(res) {
        done(res);
    })
        .removeOnComplete(true)
        .save(function(err) {
            if (err) {
                done(err);
            }
        })
}

queue.process('get-artist-details', 1, function(job, done) {
    spotifyApiServer.getRecentRelease(job.data.artist)
        .then(function(album) {
            done(null, album);
        })
        .catch(function(err) {
            console.log(err);
        })
});



module.exports = {
    // data = {user: req.user, artists: req.body.artists};
    createSyncLibJob: function(data, done) {
        syncLibrary(data, done);
    },

    // data = {user: req.user, query: req.body.query};
    createSearchArtistJob: function(data, done) {
        searchArtist(data, done);
    },

    createGetArtistDetailsJob: function(data, done) {
        getArtistDetails(data,done);
    }
};