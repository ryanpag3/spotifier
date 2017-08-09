var mongoose = require('mongoose');
var expect = require('chai').expect;
var sinon = require('sinon');
var Db = require('../../server/utils/db-wrapper');
var User = require('../../server/models/user');
var Artist = require('../../server/models/artist');

mongoose.connect('mongodb://localhost/spotifier_test');

describe('db-wrapper unit tests', function() {
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
        User.remove({}, function() {
            // clear artist collection
            Artist.remove({}, function() {
                done();
            })
        })
    });

    // test user creation validation
    it('createUser should be rejected if username is not included in object', function(done) {
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
    })
});