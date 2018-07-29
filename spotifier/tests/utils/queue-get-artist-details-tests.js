var mongoose = require('mongoose'),
    chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    sinon = require('sinon'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    User = new require('../../server/models/user'),
    Artist = new require('../../server/models/artist'),
    configPrivate = require('../../private/config-private'),
    getArtistDetailsQueue = require('../../server/utils/queue-get-artist-details');
mongoose.Promise = require('bluebird');

var options = {
    keepAlive: 1,
    connectTimeoutMS: 30000,
    useMongoClient: true,
    user: configPrivate.test.db.user,
    pass: configPrivate.test.db.password
};

mongoose.connect(configPrivate.test.db.ip, options);

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

    describe('create job tests', function () {
        it('should not error when large amounts of artist details are requested', function(done) {
            this.timeout(60000);
            var numUsers = 5,
                numArtists = 10,
                numAssigns = 50;
            testHelper.stageSampleNewReleaseDb(numUsers, numArtists, numAssigns)
                .then(function() {
                    Artist.find({}, function(err, artists) {
                        for(var i = 0; i < artists.length; i++) {
                            getArtistDetailsQueue.createJob(artists[i]);
                        }
                        done();
                    })
                })
        })
    });
});