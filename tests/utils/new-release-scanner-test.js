/** unit testing for new-release-scanner.js **/
var expect = require('chai').expect,
    mongoose = require('mongoose'),
    sinon = require('sinon'),
    fs = require('fs'),
    User = require('../../server/models/user'),
    Artist = require('../../server/models/artist'),
    email = require('../../server/utils/handler-email'),
    Db = require('../../server/utils/handler-db'),
    testHelper = require('../test-helpers'),
    sampleData = require('../sample-test-data'),
    spotifyApiServer = require('../../server/utils/spotify-server-api'),
    releaseScanner = require('../../server/utils/handler-new-releases.js');
mongoose.Promise = require('bluebird');

mongoose.connect('mongodb://localhost/spotifier_test', {
    useMongoClient: true
});

describe('new-release-scanner unit tests', function () {
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

    it('should update users who are tracking artists with notifications', function(done) {
        var numUsers = 1,
            numArtists = 10,
            numAssigns = 10;
        this.timeout(5000 * numArtists); // staging a sample database takes a little while due to artist lookup on spotify
        testHelper.stageSampleNewReleaseDb(numUsers, numArtists, numAssigns)
            .then(function() {
                // pass a boolean to determine whether to actually send the emails
                releaseScanner.startScan(false)
                    .then(function() {
                        setTimeout(function() {
                            User.find({}, function(err, users) {
                                console.log(users);
                                if (err) {
                                    expect(err).to.be.undefined;
                                }
                                var userReleasesFound = 0;
                                for(var i = 0; i < users.length; i++) {
                                    if (users[i].new_releases.length > 0) userReleasesFound++;
                                }
                                expect(userReleasesFound).to.be.greaterThan(0);
                                done();
                            })
                        }, 0);
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
            })
            .catch(function(err) {
                console.log(err);
            });

    });

    it('should run queue jobs for artist details for new releases', function(done) {
       var numUsers = 1,
           numArtists = 10,
           numAssigns = 1;

       this.timeout(10000 * numArtists); // set test timeout based on artists which is the time bottleneck
       // stage the dummy db
       testHelper.stageSampleNewReleaseDb(numUsers, numArtists, numAssigns)
           .then(function() {
               // scan for new releases
               releaseScanner.startScan(false)
                   .then(function() {
                       // query for all artists
                       Artist.find({}, function(err, artists) {
                           // check to make sure all artists have release dates added
                           setTimeout(function() {
                               for (var i = 0; i < artists.length; i++) {
                                   expect(artists[i].recent_release.release_date).to.be.a('string');
                               }
                           }, 250 * numArtists); // add a little time buffer to allow queue to finish

                           done(); // run callback on successful data validation
                       })
                   })
           })
    });

});