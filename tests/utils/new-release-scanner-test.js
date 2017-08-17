/** unit testing for new-release-scanner.js **/
var expect = require('chai').expect,
    mongoose = require('mongoose'),
    sinon = require('sinon'),
    fs = require('fs'),
    User = require('../../server/models/user'),
    Artist = require('../../server/models/artist'),
    email = require('../../server/utils/email-handler'),
    Db = require('../../server/utils/db-wrapper'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    spotifyApiServer = require('../../server/utils/spotify-server-api'),
    releaseScanner = require('../../server/utils/new-release-handler.js');
mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

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

    it('should update users who are tracking artists with notifications', function(done) {
        this.timeout(60000 * 10); // staging a sample database takes a little while due to artist lookup on spotify

        testHelper.stageSampleNewReleaseDb(200, 200, 1000)
            .then(function() {
                // pass a boolean to determine whether to actually send the emails
                releaseScanner.startScan(false)
                    .then(function() {
                        setTimeout(function() {
                            User.find({}, function(err, users) {
                                if (err) {
                                    expect(err).to.be.undefined;
                                }
                                for(var i = 0; i < users.length; i++) {
                                    expect(users[i].new_releases.length).to.be.greaterThan(0);
                                }
                                done();
                            })
                        }, 5000);
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            })
            .catch(function(err) {
                console.log(err);
            });

    })

});