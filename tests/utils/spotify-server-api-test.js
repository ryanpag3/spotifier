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

describe('spotify-server-api unit tests', function () {
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

    it('should return an array of results', function(done) {
        this.timeout(300000);
        spotifyApiServer.getNewReleases()
            .then(function(releases) {
                done();
            })
    })
});