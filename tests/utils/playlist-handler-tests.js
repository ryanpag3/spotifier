var expect = require('chai').expect,
    sinon = require('sinon'),
    mongoose = require('mongoose'),
    rewire = require('rewire'),
    fs = require('fs'),
    path = require('path'),
    Q = require('q'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    SpotifyApiUser = require('../../server/utils/spotify-user-api'),
    queueGetArtistDetails = require('../../server/utils/queue-get-artist-details'),
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

        queueGetArtistDetails.pause();

        testHelper.stageSpotifyUser(numReleases)
            .then(function (mSpotifyUser) {
                spotifyUser = mSpotifyUser;
                done();
            });
    })

    // runs after each unit test
    afterEach(function (done) {

        queueGetArtistDetails.resume();

        var emptyJson = JSON.stringify({}, null, 4);
        var fileName = 'playlist-reset-date.json';
        var filePath = path.join(__dirname, '../../server/utils/utils-resources/' + fileName);
        fs.writeFileSync(filePath, emptyJson, 'utf-8');
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
        it('should be able to handle a large amount of user playlists to update', function (done) {
            this.timeout(1000 * numUsers);
            var deferred = Q.defer();
            var promises = [];
            var users = [];
            var numUsers = 5;
            var numReleases = 20;
            testHelper.stageSpotifyUsers(numUsers, numReleases)
                .then(function(users) {
                    console.log('staged users, now updating playlists');
                    playlist.updateNewReleasePlaylists()
                        .then(function(promises) {
                            // console.log('we here?');
                            console.log(promises);
                            done();
                        });
                })
                .catch(function(err) {
                    console.log(err);
                });
        });
    });

    describe('updatePlaylist', function () {
        it('should properly resolve after updating a users playlist', function (done) {
            this.timeout(7000); // allow extra time if spotify api is slow
            var updatePlaylist = playlist.__get__('updatePlaylist');
            var api = new SpotifyApiUser();
            var twoWeeksAgo = new Date();
            twoWeeksAgo = new Date(twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14));
            spotifyUser.playlist.last_reset = twoWeeksAgo; // ensure playlist reset
            updatePlaylist(spotifyUser)
                .then(function () {
                    api.emptyPlaylist(spotifyUser);
                    done();
                })
        });
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

        it('should return false when no reset time has been recorded for a user', function (done) {
            var user = sampleData.getSpotifyAuthenticatedUserPlaylistCreated();

            playlistResetNeeded(user)
                .then(function (resetNeeded) {
                    expect(resetNeeded).to.be.false;
                    done();
                });
        });

        it('should return true when it is time to reset the playlist', function (done) {
            // this.timeout(5000);
            var resetDate = new Date();
            resetDate.setDate(resetDate.getDate() - 14); // ensure valid by moving back two weeks
            spotifyUser.playlist.last_reset = resetDate;
            playlistResetNeeded(spotifyUser)
                .then(function (resetNeeded) {
                    expect(resetNeeded).to.be.true;
                    done();
                })
                .catch(function (err) {
                    // rewire throws err to catch block
                    console.log('ERROR: should return true when it is time to reset the playlist');
                    console.log(err);
                });
        });

        it('should return false when it is not time to reset the playlist', function (done) {
            var resetDate = new Date(); // current
            spotifyUser.playlist.last_reset = resetDate;
            playlistResetNeeded(spotifyUser)
                .then(function (resetNeeded) {
                    expect(resetNeeded).to.be.false;
                    done();
                })
                .catch(function (err) {
                    // rewire throws err to catch block
                    console.log('ERROR: should return false when it is not time to reset the playlist');
                    console.log(err);
                });
        });
    });

    describe('getPlaylistResetDate', function () {
        var getPlaylistResetDate = playlist.__get__('getPlaylistResetDate');
        var saveDefaultGlobalPlaylistResetDate = playlist.__get__('saveDefaultGlobalPlaylistResetDate');
        var getLastSundayMidnight = playlist.__get__('getLastSundayMidnight');
        var saveGlobalPlaylistResetDate = playlist.__get__('saveGlobalPlaylistResetDate');

        // TODO:
        it('should serialize a default date to the JSON file if none exists.', function (done) {
            saveDefaultGlobalPlaylistResetDate()
                .then(function () {
                    var expectedDate = getLastSundayMidnight();
                    var actualDate = getPlaylistResetDate();
                    expect(actualDate.getTime()).to.be.equal(expectedDate.getTime());
                    done();
                });
        });

        it('should return the serialized date if it does exist', function (done) {
            var current = new Date();
            saveGlobalPlaylistResetDate(current)
                .then(function () {
                    var savedDate = getPlaylistResetDate();
                    expect(current.getTime()).to.equal(savedDate.getTime());
                    done();
                });
        });
    });

    describe('saveNewGlobalPlaylistResetDate', function () {
        var getPlaylistResetDate = playlist.__get__('getPlaylistResetDate');
        var saveDefaultGlobalPlaylistResetDate = playlist.__get__('saveDefaultGlobalPlaylistResetDate');
        var saveNewGlobalPlaylistResetDate = playlist.__get__('saveNewGlobalPlaylistResetDate');
        var moveDateForwardOneWeek = playlist.__get__('moveDateForwardOneWeek');
        var numDaysBetween = playlist.__get__('numDaysBetween');
        var getLastSundayMidnight = playlist.__get__('getLastSundayMidnight');

        // TODO:
        it('moveDateForward should move the specified date forward exactly one week', function (done) {
            var current = new Date();
            var oneWeekForward = moveDateForwardOneWeek(current);
            expect(numDaysBetween(current, oneWeekForward)).to.be.equal(7);
            done();
        });

        it('should serialize the new Date into the JSON file after being moved forward', function (done) {
            // this.timeout(5000);

            saveDefaultGlobalPlaylistResetDate()
                .then(function () {
                    return saveNewGlobalPlaylistResetDate();
                })
                .then(function () {
                    var def = getLastSundayMidnight();
                    var newGlobalDate = getPlaylistResetDate();
                    expect(numDaysBetween(def, newGlobalDate)).to.be.equal(7);
                    done();
                });

        });
    });
});