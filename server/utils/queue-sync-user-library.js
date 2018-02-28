var Queue = require('bull'),
    Q = require('q'),
    User = require('../models/user.js'),
    syncLibraryQueue = new Queue('sync-library'), // todo add redis production server values
    SpotifyApiUser = require('./spotify-user-api.js'),
    logger = require('./logger');
var socketUtil; // assigned on job creation, need to use global namespace to allow event listener usage

syncLibraryQueue
    .on('active', function (job, jobPromise) {
        socketUtil.alertSyncQueueStatusChange(job.data.user, 'active');
        var update = {
            sync_queue: {
                status: 'active'
            }
        };
        User.update({'_id': job.data.user._id}, update, function (err) {
            if (err) {
                logger.error(err);
            }
        })
    })
    .on('failed', function (job, err) {
        // clear user queue status just in case of fatal err
        var update = {
            sync_queue: {
                status: 'not queued'
            }
        };
        User.update({'_id': job.data.user._id}, update,
            function (err) {
                if (err) {
                    logger.error(err);
                }
            })
    })
    .on('completed', function (job, result) {
        socketUtil.alertSyncQueueStatusChange(job.data.user, 'completed');
        logger.info(job.data.user.name + ' finished their sync library job.');
        var update = {
            sync_queue: {
                status: 'not queued'
            }
        };
        User.update({'_id': job.data.user._id}, update,
            function (err) {
                if (err) {
                    logger.error(err);
                }
            })
    });

syncLibraryQueue.process(3, function (job, done) {
    var api = new SpotifyApiUser();
    api.syncLibrary(job.data.user, socketUtil)
        .then(function () {
            done();
        })
        .catch(function (err) {
            done(new Error('failed to sync library for user: ' + job.data.user.name + '. Reason: ' + err));
        })
});

libraryQueue = {
    /**
     * add sync library job for a user and serializes job information to database if they want to
     * remove themselves from the queue later.
     * @param user
     * @param mSocketUtil: this is the socket utility object that we use to emit events to the client
     * on job status change.
     * @returns {Q.Promise<T>}
     */
    createJob: function (user) {
        var deferred = Q.defer();
        syncLibraryQueue.add({user: user}, {
            attempts: 3
        })
            .then(function (job) {
                var update = {
                    sync_queue: {
                        id: job.jobId,
                        status: 'enqueued'
                    }
                };
                // add job information to db
                User.update({'_id': user._id}, update, function (err) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve();
                    }
                })
            });
        return deferred.promise;
    },

    removeJob: function (user) {
        var deferred = Q.defer();
        User.findOne({'_id': user._id}, function (err, user) {
            if (err) {
                deferred.reject(err);
            }
            syncLibraryQueue.getJob(user.sync_queue.id)
                .then(function (job) {
                    if (job) {
                        job.remove()
                            .then(function () {
                                logger.info(user.name + '\'s job has been removed.');
                                deferred.resolve();
                            })
                            .catch(function (err) {
                                deferred.reject(err);
                            });
                    } else {
                        deferred.reject('Job is currently being processed.');
                    }
                })
        });
        return deferred.promise;
    },

    getJobStatus: function (user) {
        var deferred = Q.defer();
        User.findOne({'_id': user._id}, function (err, user) {
            if (err) {
                deferred.reject(err);
            } else if (user === null) {
                deferred.reject('user does not exist');
            } else {
                deferred.resolve(user.sync_queue.status);
            }
        });
        return deferred.promise;
    },

    pause: function () {
        syncLibraryQueue.pause().then(function () {
            logger.info('sync library queue is now paused...')
        });
    },

    resume: function () {
        syncLibraryQueue.resume().then(function () {
            logger.info('sync library queue is now resumed...');
        })

    },

    enqueueScheduledSyncs: function() {
        var deferred = Q.defer();
        User.find({'sync_queue.scheduled': true}, function(err, users) {
            if (err) {
                deferred.reject(err);
            }

            for (i = 0; i < users.length; i++) {
                logger.debug('creating sync job for user');
                libraryQueue.createJob(users[i]);
            }

            deferred.resolve();
        });

        return deferred.promise;
    },

    /**
     * this is run on startup to expose the socket utility to the queue service
     * @param mSocketUtil
     */
    setSocketUtil: function(mSocketUtil) {
        socketUtil = mSocketUtil;
    }
};

module.exports = libraryQueue;