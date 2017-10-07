// TODO:
var expect = require('chai').expect,
    sinon = require('sinon'),
    mongoose = require('mongoose'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    SpotifyApiUser = require('../../server/utils/spotify-user-api'),
    User = require('../../server/models/user'),
    Artist = require('../../server/models/artist');

// deprecated promise library fix
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('spotify-user-api.js unit tests', function () {
    var spotifyUser;

    beforeEach(function (done) { // before each test
        var mins = 10;
        this.timeout(mins * 60000);
        var numReleases = 20;
        testHelper.stageSpotifyUser(numReleases)
            .then(function (mSpotifyUser) {
                spotifyUser = mSpotifyUser;
                done();
            });
    });

    afterEach(function (done) { // after each test
        User.remove({}, function () {
            Artist.remove({}, function () {
                done();
            });
        });
    });

    describe('playlistExists', function () {
        it('should return true when a valid playlist is passed to it.', function (done) {
            var api = new SpotifyApiUser(),
                user = sampleData.getSpotifyAuthenticatedUserPlaylistCreated();

            api.playlistExists(user)
                .then(function (exists) {
                    expect(exists).to.be.true;
                    done();
                });
        });

        it('should return false when an invalid playlist is passed to it.', function (done) {
            var api = new SpotifyApiUser(),
                user = sampleData.getSpotifyAuthenticatedUser();
            user.playlist_id = '1234'; // invalidate playlist id

            api.playlistExists(user)
                .then(function (exists) {
                    expect(exists).to.be.false;
                    done();
                });
        });

        it('should return false when no playlist is passed to it.', function (done) {
            var api = new SpotifyApiUser(),
                user = sampleData.getSpotifyAuthenticatedUser();

            api.playlistExists(user)
                .then(function (exists) {
                    expect(exists).to.be.false;
                    done();
                });
        });
    });

    describe('createPlaylist', function () {

        it('skipped create playlist test, uncomment in source if needed.');
        // it ('should resolve after creating a playlist for a valid user', function(done) {
        // var api = new SpotifyApiUser(),
        //     user = sampleData.getSpotifyAuthenticatedUser();

        // api.createPlaylist(user)
        //     .then(function(playlistId) {
        //         expect(playlistId).to.be.a('string');
        //         done();
        //     });
        // });

        it('should throw error when an invalid user is passed to it', function (done) {
            var api = new SpotifyApiUser(),
                user = sampleData.getFailUser();

            api.createPlaylist(user)
                .catch(function (err) {
                    expect(err).to.exist;
                    done();
                });
        });
    });

    describe('emptyPlaylist', function () {
        this.timeout(5000);
        it('should resolve after removing all tracks in the playlist', function (done) {
            var api = new SpotifyApiUser(),
                user = sampleData.getSpotifyAuthenticatedUserPlaylistCreated();

            api.emptyPlaylist(user)
                .then(function () {
                    done();
                })
        });

        it('should throw an err when an invalid playlist is provided', function (done) {
            var api = new SpotifyApiUser(),
                user = sampleData.getSpotifyAuthenticatedUser();

            api.emptyPlaylist(user)
                .catch(function (err) {
                    expect(err).to.exist;
                    done();
                })
        });
    });

    describe('getPlaylistTracks', function () {
        it('should return the tracks of a valid playlists', function (done) {
            var api = new SpotifyApiUser(),
                user = sampleData.getSpotifyAuthenticatedUserPlaylistCreated();

            api.getPlaylistTracks(user)
                .then(function (tracks) {
                    expect(tracks).to.exist;
                    done();
                });
        });

        it('should throw an err when an invalid playlist id is provided', function (done) {
            var api = new SpotifyApiUser(),
                user = sampleData.getSpotifyAuthenticatedUser();

            api.getPlaylistTracks(user)
                .catch(function (err) {
                    expect(err).to.exist;
                    done();
                })
        })
    });

    describe('addTracksToPlaylist', function () {
        it('should add all tracks and resolve', function (done) {
            this.timeout(5000);
            var api = new SpotifyApiUser();
            api.addTracksToPlaylist(spotifyUser)
                .then(function(uris) {
                    console.log(uris);
                    done();
                });
        });
    })
})