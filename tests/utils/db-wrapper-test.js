var mongoose = require('mongoose');
var expect = require('chai').expect;
var sinon = require('sinon');
var Db = require('../../server/utils/db-wrapper');
var User = new require('../../server/models/user');
var Artist = new require('../../server/models/artist');
mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/spotifier_test');

describe('db-wrapper', function() {
    var db = null;
    // before each unit test
    beforeEach(function(done) {
       // instantiate new db object
       db = new Db();
       done();
    });
    // after each unit test
    afterEach(function(done) {
       // clear user collection
       //  User.remove({}, function() {
       //      // clear artist collection
       //      Artist.remove({}, function() {
       //          done();
       //      });
       //  })
        done();
    });

    // test user creation validation
    it('createUser should be rejected if username is not included in object', function(done) {
        // fail case
        var user = {};
        db.createUser(user)
            .catch(function(err) {
                expect(err).to.exist;
                done();
            })
    });

    it('getUser should be rejected if user does not exist in database', function(done) {
        // fail case
        var user = {name: 'idontexist'};
        db.getUser(user)
            .catch(function(err) {
                expect(err).to.exist;
                done();
            })
    });

    it('addArtist should throw error if an invalid artist object is passed to it', function(done) {
        // fail case
        var artist = {}, user = {name: 'test'};
        db.addArtist(user, artist)
            .catch(function(err) {
                expect(err).to.exist;
                done()
            })
    });

    it('addAllArtists should be rejected if invalid user is passed to it', function(done) {
        // fail case
        var user = {name: 'idontexist'};
        // valid artists
        var artists = [{spotify_id: '1234', name: 'artist1', recent_release: {title: 'validtitle'}}];
        db.addAllArtists(user, artists)
            .catch(function(err) {
                expect(err).to.exist;
                done();
            })
    });

    it('addAllArtists should throw error if invalid artist array is passed to it', function(done) {
        // create test user
        var user = new User({
            name: 'boobies'
        }).save(function(err, user) {
            console.log(user.name + ' has been created');
        });

        // create fail case
        var artists = [{},{}];

        db.addAllArtists(user, artists)
            .catch(function(err) {
                expect(err).to.exist;
                done();
            })
    });
});