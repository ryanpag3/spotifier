/** unit testing for new-release-scanner.js **/
var expect = require('chai').expect,
    mongoose = require('mongoose'),
    User = require('../../server/models/user'),
    Artist = require('../../server/models/artist'),
    logger = require('../../server/utils/logger'),
    testHelper = require('../test-helpers'),
    configPrivate = require('../../private/config-private'),
    releaseScanner = require('../../server/utils/new-releases.js');
mongoose.Promise = require('bluebird');

var options = {
    keepAlive: 1,
    connectTimeoutMS: 30000,
    useMongoClient: true,
    user: configPrivate.test.db.user,
    pass: configPrivate.test.db.password
};

mongoose.connect(configPrivate.test.db.ip, options);

describe('new-release-scanner unit tests', function () {
    // before each unit test
    beforeEach(function (done) {
        done();
    });

    // after each unit test
    afterEach(function (done) {
        User.remove({}, function () { // drop user collection
            Artist.remove({}, function () { // drop artist collection
                done(); // callback
            })
        })
    });

    // disabling due to build time and poor test definitions. 
    // TODO: redesign tests in new architecture
    // it('should update users who are tracking artists with notifications', function (done) {
    //     var numUsers = 1,
    //         numArtists = 10,
    //         numAssigns = 100;
    //     this.timeout(60000 * 10); // staging a sample database takes a little while due to artist lookup on spotify
    //     testHelper.stageSampleNewReleaseDb(numUsers, numArtists, numAssigns)
    //         .then(function () {
    //             // pass a boolean to determine whether to actually send the emails
    //             releaseScanner.startScan(true)
    //                 .then(function () {
    //                     setTimeout(function () {
    //                         User.find({}, function (err, users) {
    //                             if (err) {
    //                                 expect(err).to.be.undefined;
    //                             }
    //                             done();
    //                         })
    //                     }, 0);
    //                 })
    //                 .catch(function (err) {
    //                     logger.error(err.stack.toString())
    //                 });
    //         })
    //         .catch(function (err) {
    //             logger.error(err.stack.toString())
    //         });

    // });

    // it('should run queue jobs for artist details for new releases', function (done) {
    //     var numUsers = 1,
    //         numArtists = 2,
    //         numAssigns = 1;

    //     this.timeout(60000 * 45); // set test timeout based on artists which is the time bottleneck
    //     // stage the dummy db
    //     testHelper.stageSampleNewReleaseDb(numUsers, numArtists, numAssigns)
    //         .then(function () {
    //             // scan for new releases
    //             releaseScanner.startScan(false)
    //                 .then(function () {
    //                     // query for all artists
    //                     Artist.find({}, function (err, artists) {
    //                         // check to make sure all artists have release dates added
    //                         setTimeout(function () {
    //                             for (var i = 0; i < artists.length; i++) {
    //                                 expect(artists[i].recent_release.release_date).to.not.be.undefined;
    //                             }
    //                         }, 250 * numArtists); // add a little time buffer to allow queue to finish

    //                         done(); // run callback on successful data validation
    //                     })
    //                 })
    //         })
    // });

});