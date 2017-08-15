var Queue = require('bull'),
    syncLibraryQueue = new Queue('sync-library'),
    SpotifyApiUser = require('./spotify-user-api.js');

syncLibraryQueue
    .on('active', function (job, jobPromise) {
        console.log(job.data.user.name + ' started sync library job.')
    })
    .on('failed', function (job, err) {
        // todo add console log
    })
    .on('completed', function (job, result) {
        console.log(job.data.user.name + ' finished their sync library job.');
        // todo add console log
    });

syncLibraryQueue.process(3, function(job, done) {
    var api = new SpotifyApiUser();
    api.syncLibrary(job.data.user)
        .then(function() {
            done();
        })
        .catch(function(err) {
            done(new Error('failed to sync library for user: ' + job.data.user.name + '. Reason: ' + err));
        })
});

module.exports = {
    createJob: function(user){
        syncLibraryQueue.add(user, {
            attempts: 3
        });
    },

    pause: function() {
        syncLibraryQueue.pause();
        console.log('sync library queue is now paused...')
        },

    resume: function() {
        syncLibraryQueue.resume().then(function() {
            console.log('sync library queue is now unpaused...');
        })

    }
};