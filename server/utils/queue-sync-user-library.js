var Queue = require('bull'),
    Q = require('q'),
    User = require('../models/user.js'),
    syncLibraryQueue = new Queue('sync-library'), // todo add redis production server values
    SpotifyApiUser = require('./spotify-user-api.js'),
    SpotifyAPI = require('./spotify-api'),
    logger = require('./logger');
var socketUtil; // assigned on job creation, need to use global namespace to allow event listener usage

syncLibraryQueue
    .on('active', function (job, jobPromise) {
        if (socketUtil)
            socketUtil.alertSyncQueueStatusChange(job.data.user, 'active');
        User.findOne({
            '_id': job.data.user._id
        }, (err, user) => {
            if (err)
                logger.error(err);
            if (user) {
                user.sync_queue.status = 'active';
                user.save();
            }
        });
    })
    .on('failed', function (job, err) {
        User.findOne({
            '_id': job.data.user._id
        }, (err, user) => {
            if (err)
                logger.error(err);
            if (user) {
                user.sync_queue.id = undefined;
                user.sync_queue.status = 'not queued';
                user.save();
            }
        });
    })
    .on('completed', function (job, result) {
        logger.info(job.data.user.name + ' finished their sync library job.');
        if (socketUtil)
            socketUtil.alertSyncQueueStatusChange(job.data.user, 'completed');
        User.findOne({
            '_id': job.data.user._id
        }, (err, user) => {
            if (err)
                logger.error(err);
            if (!user) {
                logger.debug('User does not exist in database anymore. Ignoring sync_queue status change.');
                return;
            }
            user.sync_queue.id = undefined;
            user.sync_queue.status = 'not queued';
            user.save();
        });
    });

syncLibraryQueue.process(10, async function (job, done) {
    const api = new SpotifyAPI(job.data.user.refresh_token, socketUtil);
    try {
        await api.syncLibrary(job.data.user);
    } catch (e) {
        logger.error(e.toString());
    }
    done();
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
        syncLibraryQueue.add({
                user: user
            }, {
                attempts: 3
            })
            .then(function (job) {
                // add job information to db
                User.update({
                    '_id': user._id
                }, {
                    'sync_queue.id': job.jobId,
                    'sync_queue.status': 'enqueued'
                }, function (err) {
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
        User.findOne({
            '_id': user._id
        }, function (err, user) {
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
        User.findOne({
            '_id': user._id
        }, function (err, user) {
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

    enqueueScheduledSyncs: function () {
        var deferred = Q.defer();
        User.find({
            'sync_queue.scheduled': true
        }, function (err, users) {
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
    setSocketUtil: function (mSocketUtil) {
        socketUtil = mSocketUtil;
    }
};

module.exports = libraryQueue;