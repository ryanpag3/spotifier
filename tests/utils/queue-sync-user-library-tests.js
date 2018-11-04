var mongoose = require('mongoose'),
    chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    sinon = require('sinon'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    User = new require('../../server/models/user'),
    Artist = new require('../../server/models/artist'),
    RedisClient = require('../../server/utils/redis'),
    syncUserLibraryQueue = require('../../server/utils/queue-sync-user-library');
    mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('sync library queue utility', function () {
    // before each unit test
    beforeEach(async function () {
        await RedisClient.flushall();
    });
    // after each unit test
    afterEach(function (done) {
        // clear user collection
        User.remove({}, function () {
            // clear artist collection
            Artist.remove({}, function () {
                done();
            });
        });
    });

    describe('calls create job method', function () {
        it('should serialize a job id and set enqueued to true when a user is entered into the queue', function(done) {
            testHelper.insert(sampleData.getPassUser())
                .then(function(user) {
                    syncUserLibraryQueue.createJob(user)
                        .then(function() {
                            User.find({'_id': user._id}, function(err, user) {
                                expect(user[0]).to.not.be.undefined;
                                expect(err).to.be.equal(null);
                                expect(user[0].sync_queue.status).to.be.equal('enqueued');
                                assert.isNumber(user[0].sync_queue.id);
                                done();
                            })
                        })
                });
        })
    });

    describe('calls remove job method', function () {
        it('it should resolve when the job has successfully been removed from the queue', function(done) {
            testHelper.insert(sampleData.getSpotifyAuthenticatedUser())
                .then(async function(user) {
                    await syncUserLibraryQueue.pause();
                    syncUserLibraryQueue.createJob(user)
                        .then(function() {
                            syncUserLibraryQueue.removeJob(user)
                                .then(async function() {
                                    await syncUserLibraryQueue.resume();
                                    done();
                                })
                                .catch((err) => console.log(err));
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
        })
    });

    describe('enqueueScheduledSyncs', function() {
        it('should create sync library jobs for all users with the valid condition', function(done) {
            this.timeout(15000);
            testHelper.stageSpotifyUser(20)
                .then(function(user) {
                    syncUserLibraryQueue.enqueueScheduledSyncs()
                        .then(function() {
                            done();
                        })
                });
        });
    });
});