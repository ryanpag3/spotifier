var expect = require('chai').expect;
var User = require('../../server/models/user');

describe('user model validation', function() {
   it ('should be invalid if user name is not included', function(done) {
       var user = new User(); // fail case
       user.validate(function(err) {
           expect(err.errors.name).to.exist;
           done();
       })
   })
});