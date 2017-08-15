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
    spotifyApiServer = require('../../server/utils/spotify-server-api');
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

    it('should add artist ids of artists with new releases found to user docs', function (done) {
        this.timeout(6000);
        testHelper.stageSampleNewReleaseDb()
            .then(function (users) {
                for (var i = 0; i < users.length; i++) {
                    expect(users[i].saved_artists.length).to.be.greaterThan(0);
                }
                done();
            });
    });

});