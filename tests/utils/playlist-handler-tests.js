var expect = require('chai').expect,
    sinon = require('sinon'),
    mongoose = require('mongoose'),
    rewire = require('rewire'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    spotifyApiUser = require('../../server/utils/spotify-user-api'),
    User = require('../../server/models/user'),
    Artist = require('../../server/models/artist');

mongoose.Promise = require('bluebird');
playlist = rewire('../../server/utils/playlist-handler');

// connect to dummy database
mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('playlist handler', function () {
    var spotifyUser;
    // runs before each unit test
    beforeEach(function (done) {
        var mins = 10;
        this.timeout(mins * 60000);
        var numReleases = 20;
        testHelper.stageSpotifyUser(numReleases)
            .then(function (mSpotifyUser) {
                spotifyUser = mSpotifyUser;
                done();
            });
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
    describe('updateNewReleasesPlaylists', function () {
        it('disabled updateNewReleasePlaylists succeed test to avoid unnecessary playlist creation.');
        // it('should properly resolve after all users playlists have been updated', function (done) {
        //     this.timeout(3000); // 3 secs
        //     testHelper.stageSpotifyUser(20)
        //         .then(function () {
        //             playlist.updateNewReleasePlaylists()
        //                 .then(function (promises) {
        //                     console.log(promises);
        //                     done();
        //                 })
        //                 .catch(function () {
        //                     console.log('err thrown');
        //                     console.log(err);
        //                 });
        //         });
        // });
    });

    describe('updatePlaylist', function () {
        // TODO:
    });

    describe('playlistExists', function () {
        var passUser = sampleData.getSpotifyAuthenticatedUserPlaylistCreated();
        var failUser = sampleData.getSpotifyAuthenticatedUser();
        var playlistExists = playlist.__get__('playlistExists');

        it('should should return true when a valid user is passed', function (done) {
            playlistExists(passUser)
                .then(function (exists) {
                    expect(exists).to.be.true;
                    done();
                });
        });

        it('should return false when an invalid user is passed to it.', function (done) {
            playlistExists(failUser)
                .then(function (exists) {
                    expect(exists).to.be.false;
                    done();
                });
        });
    });

    describe('playlistResetNeeded', function () {
        var playlistResetNeeded = playlist.__get__('playlistResetNeeded');
        it('should return true when it is time to reset the playlist', function(done) {
            playlistResetNeeded(spotifyUser)
                .then(function() {
                    done();
                });
        });
    });

    describe('getPlaylistResetDate', function () {
        var getPlaylistResetDate = playlist.__get__('getPlaylistResetDate');
        it('should return the playlist reset date from the serialized json file', function (done) {
            var date = getPlaylistResetDate();
            console.log(date);
            expect(date).to.exist;
            done();
        })
    });
});