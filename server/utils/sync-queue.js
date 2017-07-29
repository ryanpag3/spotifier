var kue = require('kue'),
    queue = kue.createQueue(),
    artistDb = require('../utils/db-artist-wrapper.js'),
    userDb = require('../utils/db-user-wrapper.js');

function syncLibrary(data, done) {
    var job = queue.create('sync-library', data)
        .removeOnComplete(true)
        .save(function(err) {
            if (err) {
                console.log(err);
                done(err);
            } else {
                done();
            }
        });
    job.on('start', function() {
       console.log('Now syncing ' + data.user + '\'s library.')
    });
    job.on('complete', function(){
        console.log(data.user + '\'s library has been synced.');
    })
}

queue.process('sync-library', 1, function(job, done) {
    var i = 0,
        userId = job.data.user,
        artists = job.data.artists;
    function go() {
        artistDb.insert(artists[i++].artistId);
        if (i < artists.length){
            setTimeout(go, 300);
        } else {
            done(); // invoke callback
        }
    }
    go();

});


module.exports = {
    create: function(data, done) {
        syncLibrary(data, done);
    }
};