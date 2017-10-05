var expect = require('chai').expect,
    sinon = require('sinon'),
    mongoose = require('mongoose'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    spotifyApiUser = require('../../server/utils/spotify-user-api'),
    playlist = require('../../server/utils/playlist-handler'),
    User = require('../../server/models/user'),
    Artist = require('../../server/models/artist');
mongoose.Promise = require('bluebird');

// connect to dummy database
mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('playlist handler', function () {
    // runs before each unit test
    beforeEach(function (done) {
        done();
    })

    // runs after each unit test
    afterEach(function (done) {
        User.remove({}, function () { // drop user collection
            Artist.remove({}, function () { // drop artist collection
                done();
            });
        });
    });

    /** UNIT TESTS **/
    it('updateNewReleasePlaylists should properly resolve after all users playlists have been updated', function (done) {
        this.timeout(600000);
        testHelper.stageSpotifyUser(20)
            .then(function () {
                playlist.updateNewReleasePlaylists()
                    .then(function () {
                        done();
                    })
            })
    })
})