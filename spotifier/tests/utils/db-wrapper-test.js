var mongoose = require('mongoose');
var expect = require('chai').expect;
var sinon = require('sinon');
var testHelper = require('../test-helpers');
var sampleData = require('../sample-test-data');
var Db = require('../../server/utils/db');
var User = new require('../../server/models/user');
var Artist = new require('../../server/models/artist');
var logger = require('../../server/utils/logger');
mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('db-wrapper', function () {
    var db = null;
    // before each unit test
    beforeEach(function (done) {
        // instantiate new db object
        db = new Db();
        done();
    });
    // after each unit test
    afterEach(function (done) {
        // clear user collection
        User.remove({}, function () {
            // clear artist collection
            Artist.remove({}, function () {
                done();
            });
        });
    });

    // test user creation validation
    it('createUser should be rejected if username is not included in object', function (done) {
        // fail case
        const user = sampleData.getFailUser();
        db.createUser(user)
            .catch(function (err) {
                expect(err).to.exist;
                done();
            })
    });

    it('getUser should be rejected if user does not exist in database', function (done) {
        // fail case
        const user = sampleData.getFailUser();
        db.getUser(user)
            .catch(function (err) {
                expect(err).to.exist;
                done();
            })
    });

    it('addArtist should throw error if an invalid artist object is passed to it', function (done) {
        // fail case
        const artist = sampleData.getFailArtist(),
            user = sampleData.getPassUser();
        db.addArtist(user, artist)
            .catch(function (err) {
                expect(err).to.exist;
                done();
            })
    });

    it('addAllArtists should be rejected if invalid user is passed to it', function (done) {
        this.timeout(5000); // in millis
        // fail case
        const user = sampleData.getFailUser();
        // valid artists
        const artists = sampleData.getPassArtists();
        db.addAllArtists(user, artists)
            .catch(function (err) {
                expect(err).to.exist;
                done();
            })
    });

    it('addAllArtists should throw error if invalid artist array is passed to it', function (done) {
        const artists = sampleData.getFailArtists(); // fail case
        testHelper.insert(sampleData.getPassUser())
            .then(function (user) {
                db.addAllArtists(user, artists)
                    .catch(function (err) {
                        expect(err).to.exist;
                        done();
                    })
            });
    });

    it('assignArtist should add valid user and artist ids to the relevant fields', function (done) {
        testHelper.insert(sampleData.getPassUser())
            .then(function (user) {
                testHelper.insert(sampleData.getPassArtist())
                    .then(function (artist) {
                        db.assignArtist(user, artist)
                            .then(function () {
                                // assign artist returns success
                                done();
                            })
                    })
            })
    });

    it('emailExists returns false if an email has not been added for a user', function (done) {
        testHelper.insert(sampleData.getFailEmailUser())
            .then(function (user) {
                db.emailExists(user)
                    .then(function (exists) {
                        expect(exists).to.equal(false);
                        done();
                    })
            })
    });

    it('emailConfirmed returns false if an email has not been confirmed for a user', function (done) {
        const user = sampleData.getFailEmailUser();
        user.email = {address: 'added@this'}; // adjust sample case to check for confirmation
        testHelper.insert(user)
            .then(function (user) {
                db.emailConfirmed(user)
                    .then(function (confirmed) {
                        expect(confirmed).to.equal(false);
                        done();
                    });
            })
    });

    it('addEmail should resolve once an email has been added for a user', function (done) {
        testHelper.insert(sampleData.getFailEmailUser())
            .then(function (user) {
                db.addEmail(user, 'test@email')
                    .then(function () {
                        db.getUser(user)
                            .then(function (user) {
                                expect(user.email.address).to.equal('test@email');
                                done();
                            })
                    })
            });
    });

    it('deleteEmail should resolve once an email has been removed for a user', function (done) {
        testHelper.insert(sampleData.getPassUser())
            .then(function (user) {
                db.removeEmail(user)
                    .then(function () {
                        db.getUser(user)
                            .then(function (user) {
                                expect(user).to.not.have.key('email');
                                done();
                            })
                    })
            })
    });

    it('confirmEmail should resolve if a user passes the correct confirmation', function (done) {
        var user = sampleData.getFailEmailUser();
        user.email = { // add email test case
            address: 'myemail@email.com',
            confirmed: false,
            confirm_code: '1234'
        };
        testHelper.insert(user)
            .then(function (user) {
                db.confirmEmail(user, '1234')
                    .then(function () {
                        db.getUser(user)
                            .then(function (user) {
                                expect(user.email.confirm_code).to.equal('1234');
                                done();
                            })
                    })
            })
    });

    it('setConfirmCode should resolve if the user collection serializes the correct code for the user', function(done) {
        const confirm_code = '1234';
        testHelper.insert(sampleData.getPassUser())
            .then(function(user) {
                db.setConfirmCode(user, confirm_code)
                    .then(function() {
                        db.getUser(user)
                            .then(function(user) {
                                expect(user.email.confirm_code).to.be.equal(confirm_code);
                                done();
                            })
                    })
            })
    });

    it('changeUserPlaylistSetting should resolve if the user is correctly updated with the active playlist setting', function(done) {
        var user = sampleData.getPassUser();
        user.playlist = {
            enabled: false
        };

        testHelper.insert(user)
            .then(function(user) {
                db.changeUserPlaylistSetting(user._id, true)
                    .then(function(enabled) {
                        expect(enabled).to.equal(true);
                        done();
                    })
            })
            .catch(function(err) {
                logger.debug(err);
            })
    });

    it('getUserPlaylistSetting should throw an error when an invalid user id is passed to it', function(done) {
        var user = sampleData.getFailUser();
        db.getUserPlaylistSetting(user)
            .catch(function(err) {
                expect(err).to.exist;
                done();
            });
    });

    it('getUserPlaylistSetting should return the correct playlist enabled setting when a valid user is passed to it', function(done) {
        var user = sampleData.getPassUser();
        user.playlist = {
            enabled: true
        }
        testHelper.insert(user)
            .then(function(user) {
                db.getUserPlaylistSetting(user._id)
                    .then(function(playlistEnabled) {
                        expect(playlistEnabled).to.equal(true);
                        done();
                    });
            });
    });
});