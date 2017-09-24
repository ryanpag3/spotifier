var expect = require('chai').expect,
    sinon = require('sinon'),
    mongoose = require('mongoose'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    User = require('../../server/models/user'),
    Artist = require('../../server/models/artist');
    mongoose.Promise = require('bluebird');

// connect to dummy database
mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('playlist handler', function() {
    // runs before each unit test
    beforeEach(function(done) {
        done();
    })

    // runs after each unit test
    afterEach(function(done) {
        User.remove({}, function() { // drop user collection
            Artist.remove({}, function() { // drop artist collection
                done();
            });
        });
    });

    /** UNIT TESTS **/
    it ('')
})