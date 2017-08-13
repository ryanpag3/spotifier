/** unit testing for new-release-scanner.js **/
var expect = require('chai').expect,
    mongoose = require('mongoose'),
    sinon = require('sinon'),
    User = require('../../server/models/user'),
    Artist = require('../../server/models/artist'),
    email = require('../../server/utils/email-handler'),
    Db = require('../../server/utils/db-wrapper'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data');
mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('new-release-scanner unit tests', function() {
   // before each unit test
    beforeEach(function(done) {
       done();
   });

    // after each unit test
   afterEach(function(done) {
       User.remove({}, function () { // drop user collection
           Artist.remove({}, function () { // drop artist collection
               done(); // callback
           })
       })
   });

   it('scan should resolve ')
});