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

describe('email-handler tests', function () {
    // run before each unit test
    beforeEach(function (done) {
        done();
    });

    // run after each unit test
    afterEach(function (done) {
        User.remove({}, function () { // drop user collection
            Artist.remove({}, function () { // drop artist collection
                done(); // callback
            })
        })
    });

    it('sendConfirmationEmail should resolve on a successful email sent with a confirmCode', function (done) {
        this.timeout(4000); // allow more time for this unit test
        testHelper.insert(sampleData.passUser())
            .then(function (user) {
                email.sendConfirmationEmail(user)
                    .then(function (successMsg) {
                        expect(successMsg).to.exist;
                        done();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            })
    });

    it('confirm should resolve if the confirmation code for the specified user is equal to the one in the user doc', function (done) {
        var testConfirmCode = '1234';
        testHelper.insert(sampleData.unconfirmedUser())
           .then(function(user) {
               const query = {code: testConfirmCode, id: user._id.toString()};
               email.confirm(user, query)
                   .then(function() {
                       db.getUser(user)
                           .then(function(user) {
                               expect(user.email.confirmed).to.equal(true);
                               done();
                           })
                   })
           })
    });
});