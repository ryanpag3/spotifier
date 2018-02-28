/** unit testing for new-release-scanner.js **/
var expect = require('chai').expect,
    mongoose = require('mongoose'),
    sinon = require('sinon'),
    fs = require('fs'),
    User = require('../server/models/user'),
    Artist = require('../server/models/artist'),
    email = require('../server/utils/email'),
    Db = require('../server/utils/db'),
    logger = require('../server/utils/logger'),
    testHelper = require('./test-helpers'),
    sampleData = require('./sample-test-data'),
    spotifyApiServer = require('../server/utils/spotify-server-api');
mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('test-helper unit tests', function () {
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

    it('getArtists should grab all artists released in the past two weeks and insert them into a file', function (done) {
        this.timeout(500000);
        testHelper.getArtists()
            .then(function (releases) {
                expect(releases).to.not.be.undefined;
                done();
            })
    });

    it('addRandomArtists should insert n number of artists at random to the artist db', function (done) {
        this.timeout(600000);
        var n = 5;
        testHelper.addRandomArtists(n)
            .then(function (res) {
                Artist.find({}, function (err, artists) {
                    expect(artists.length).to.equal(n);
                    done();
                });
            })
    });

    it('addRandomUsers should insert n number of users at random to the user db', function (done) {
        var n = 50;
        testHelper.addRandomUsers(n)
            .then(function (res) {
                User.find({}, function (err, users) {
                    expect(err).to.be.null;
                    expect(users.length).to.equal(n);
                    done();
                })
            })
    });

    it('assignRandom should make n amount of assignments to users and artists', function (done) {
        this.timeout(45000);
        const numUsers = 1;
        const numArtists = 5;
        const numAssigns = 10;
        
        testHelper.addRandomUsers(numUsers)
            .then(function () {
                testHelper.addRandomArtists(numArtists)
                    .then(function () {
                        testHelper.assignRandom(numAssigns)
                            .then(function () {
                                User.find({}, function (err, users) {
                                    done();
                                })
                            })
                            .catch(function (err) {
                                logger.error(err);
                            })
                    })
            })
    });

    it('stageSpotifyUser should add artists to database and assign them to spotify user as new releases', function (done) {
        this.timeout(5000);
        var numOfReleases = 20;
        testHelper.stageSpotifyUser(numOfReleases)
            .then(function (user) {
                Artist.find({}, function (err, artists) {
                    expect(artists).to.have.lengthOf(numOfReleases);
                    User.findOne({
                        'name': user.name
                    }, function (err, user) {
                        expect(user.new_releases).to.exist;
                        done();
                    })
                })
            })
    });

    it('stageSpotifyUser should create a playlist for the test user', function(done) {
        this.timeout(30000);
        testHelper.stageSpotifyUser(10)
            .then(function(user) {
                expect(user.playlist.id).to.exist;
                done();
            })
            .catch(function(err) {
            });
    });
});