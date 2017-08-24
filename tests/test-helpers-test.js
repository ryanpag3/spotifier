/** unit testing for new-release-scanner.js **/
var expect = require('chai').expect,
    mongoose = require('mongoose'),
    sinon = require('sinon'),
    fs = require('fs'),
    User = require('../server/models/user'),
    Artist = require('../server/models/artist'),
    email = require('../server/utils/handler-email'),
    Db = require('../server/utils/handler-db'),
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

    // it('should add artist ids of artists with new releases found to user docs', function (done) {
    //     this.timeout(6000);
    //     testHelper.stageSampleNewReleaseDb()
    //         .then(function (users) {
    //             for (var i = 0; i < users.length; i++) {
    //                 expect(users[i].saved_artists.length).to.be.greaterThan(0);
    //             }
    //             done();
    //         });
    // });

    it('should grab all artists released in the past two weeks and insert them into a file', function (done) {
        this.timeout(500000);
        testHelper.getArtists()
            .then(function (releases) {
                expect(releases).to.not.be.undefined;
                done();
            })
    });

    it('should insert n number of artists at random to the artist db', function (done) {
        this.timeout(600000);
        var n = 5;
        testHelper.addRandomArtists(n)
            .then(function (res) {
                console.log(res);
                Artist.find({}, function (err, artists) {
                    expect(artists.length).to.equal(n);
                    done();
                });
            })
    });

    it('should insert n number of users at random to the user db', function (done) {
        var n = 50;
        testHelper.addRandomUsers(n)
            .then(function (res) {
                console.log(res);
                User.find({}, function (err, users) {
                    expect(err).to.be.null;
                    expect(users.length).to.equal(n);
                    done();
                })
            })
    });

    it('should make n amount of assignments to users and artists', function (done) {
        this.timeout(45000);
        var n = 100;
        testHelper.addRandomUsers(30)
            .then(function () {
                testHelper.addRandomArtists(30)
                    .then(function () {
                        testHelper.assignRandom(100)
                            .then(function () {
                                User.find({}, function (err, users) {
                                    console.log(users);
                                    done();
                                })
                            })
                            .catch(function (err) {
                                console.log(err);
                            })
                    })
            })
    })
});