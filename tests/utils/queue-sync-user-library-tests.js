var mongoose = require('mongoose'),
    chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    sinon = require('sinon'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    User = new require('../../server/models/user'),
    Artist = new require('../../server/models/artist'),
    syncUserLibraryQueue = require('../../server/utils/queue-sync-user-library');
    mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('sync library queue utility', function () {
    // before each unit test
    beforeEach(function (done) {
        done();
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
            testHelper.insert(sampleData.passUser())
                .then(function(user) {
                    syncUserLibraryQueue.createJob(user)
                        .then(function() {
                            User.findOne({'_id': user._id}, function(err, user) {
                                expect(user).to.not.be.undefined;
                                expect(err).to.be.equal(null);
                                expect(user.sync_queue.enqueued).to.be.true;
                                assert.isNumber(user.sync_queue.id);
                                done();
                            })
                        })
                });
        })
    });

});