var Q = require('q'),
    User = require('../server/models/user'),
    Artist = require('../server/models/artist'),
    sampleData = require('./sample-test-data');

module.exports = {
    insert: function(user) {
        var deferred = Q.defer();
        User.create(user, function(err, user) {
            deferred.resolve(user);
        });
        return deferred.promise;
    }
};