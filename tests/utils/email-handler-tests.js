var expect = require('chai').expect,
    mongoose = require('mongoose'),
    sinon = require('sinon'),
    User = require('../../server/models/user'),
    Artist = require('../../server/models/artist'),
    email = require('../../server/utils/email'),
    logger = require('../../server/utils/logger'),
    releaseScanner = require('../../server/utils/new-releases'),
    Db = require('../../server/utils/db'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    redis = require('../../server/utils/redis');
mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('email-handler tests', function () {
    // run before each unit test
    beforeEach(function (done) {
        redis.flushall();
        done();
    });

    // run after each unit test
    afterEach(function (done) {
        User.remove({}, function () { // drop user collection
            Artist.remove({}, function () { // drop artist collection
                done(); // callback
            })
        })
    });

    it('sendConfirmationEmail should resolve on a successful email sent with a confirmCode', function (done) {
        this.timeout(10000); // allow more time for this unit test
        testHelper.insert(sampleData.getUnconfirmedUser())
            .then(function (user) {
                email.sendConfirmationEmail(user)
                    .then(function (successMsg) {
                        expect(successMsg).to.exist;
                        done();
                    })
                    .catch(function (err) {
                        logger.error(err);
                    });
            })
    });

    it('confirm should resolve if the confirmation code for the specified user is equal to the one in the user doc', function (done) {
        var db = new Db();
        var testConfirmCode = '1234';
        testHelper.insert(sampleData.getUnconfirmedUser())
           .then(function(user) {
               // serialize confirm code for user
               db.setConfirmCode(user, testConfirmCode)
                   .then(function() {
                       // generate dummy query
                       const query = {code: testConfirmCode, id: user._id.toString()};
                       email.confirm(query)
                           .then(function() {
                               db.getUser(user)
                                   .then(function(user) {
                                       expect(user.email.confirmed).to.equal(true);
                                       done();
                                   })
                                   .catch(function(err) { // catch getUser err
                                       logger.error(err);
                                   })
                           })
                           .catch(function(err) { // catch confirm err
                               logger.error(err);
                           })
                   })
                   .catch(function(err) { // catch setConfirmCode err
                       logger.error(err);
                   })
           })
            .catch(function(err) { // catch insert err
                logger.error(err);
            })
    });

    it('confirm should reject with an \'invalid confirm code\' error if an invalid confirmation code is passed through the query', function(done) {
        var db = new Db();
        var testConfirmCode = '1234',
            failConfirmCode = '4321';
        testHelper.insert(sampleData.getUnconfirmedUser())
            .then(function(user) {
                // serialize confirm code for user
                db.setConfirmCode(user, testConfirmCode)
                    .then(function() {
                        // generate dummy query
                        const query = {code: failConfirmCode, id: user._id.toString()};
                        email.confirm(query)
                            .catch(function(err) { // catch confirm err
                                expect(err).to.equal('invalid confirm code');
                                done();
                            })
                    })
                    .catch(function(err) { // catch setConfirmCode err
                        logger.error(err);
                    })
            })
            .catch(function(err) { // catch insert err
                logger.error(err);
            })
    });

    it('should resolve after all users have been notified of their new releases', function(done) {
        var numUsers = 7,
            numArtists = 15,
            numAssigns = 1000;
        this.timeout(60000 * numArtists); // staging the database takes a little while
        // (number of users, number of artists, number of random assignments)
        testHelper.stageSampleNewReleaseDb(numUsers, numArtists, numAssigns)
            .then(function() {
                releaseScanner.startScan(true)
                    .then(function() {
                        done();
                    })
            })
    });


    it('should send out several emails to users in the same batch', function(done) {
        var numUsers = 7,
            numArtists = 2,
            numAssigns = 1000;
        this.timeout(60000 * numArtists); // staging the database takes a little while
        // (number of users, number of artists, number of random assignments)
        testHelper.stageSampleNewReleaseDb(numUsers, numArtists, numAssigns)
            .then(function() {
                releaseScanner.startScan(true)
                    .then(function() {
                        done();
                    })
            })
    });
});