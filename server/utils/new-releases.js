var CronJob = require('cron').CronJob,
    Q = require('q'),
    Artist = require('../models/artist'),
    Db = require('./db'),
    getArtistDetailsQueue = require('./queue-get-artist-details'),
    syncLibraryQueue = require('./queue-sync-user-library'),
    spotifyApiServer = require('../utils/spotify-server-api'),
    emailHandler = require('./email');


/**
 * cron job will be run every 24 hours at a predetermined time
 * the job will iterate through every artist in the master list
 * if an artist has already been detailed and a release has been found for that day, we skip
 * otherwise we add a get details job for that artist to find their most recent release
 *
 * if a release is found for an artist
 * add the artist id to each user that is tracking the artist in their new releases field
 *
 * once the scanner has processed every artist, we run a query on the user table
 * 1. query for every user that has a new release field that is not empty
 * 2. iterate through this query
 * 3. for every new combination of new releases found, query for other users with that same combination
 * 4. add all users for that combination to a bulk email, send email, and clear their new release fields
 */
function scan() {
    console.log('scan started!');
    var deferred = Q.defer();
    var db = new Db();
    spotifyApiServer.getNewReleases()
        .then(function (releases) {
            var i = 0;
            run();

            function run() {
                Artist.findOne({
                    'spotify_id': releases[i].spotify_id,
                    'recent_release.id': {$nin: [releases[i].recent_release.id, null]}
                }, function (err, artist) {
                    if (err) {
                        console.log(err);
                    }
                    if (artist !== null) {
                       console.log('new release found!');
                        Artist.findOneAndUpdate({'_id': artist._id}, {'recent_release' : releases[i].recent_release},
                            function(err, artist) {
                                // queue up job to get detailed release info
                                getArtistDetailsQueue.createJob(artist);
                            });
                        db.artistNewReleaseFound(artist);
                    }
                    i++;
                    if (i < releases.length) {
                        run();
                    } else {
                        console.log('done processing new releases!');
                        deferred.resolve();
                    }
                })
            }
        });
    return deferred.promise;
}

/**
 * Pauses the running job queues, scans for new releases, then if sendEmails is set to true,
 * calls the email handler sendNewReleasesEmails function.
 *
 * @param sendEmails: boolean to determine if we are actually going to send out the emails
 * @returns {Q.Promise<T>}
 */
var startScan = function (sendEmails) {
    var deferred = Q.defer();
    // pause job queues
    syncLibraryQueue.pause();
    getArtistDetailsQueue.pause();
    // scan for new releases
    scan()
        .then(function () {
            // resume job queues
            syncLibraryQueue.resume();
            getArtistDetailsQueue.resume();

            if (sendEmails === true) {
                // send new release emails
                emailHandler.sendNewReleaseEmails()
                    .then(function () {
                        console.log('EMAIL SERVICE RESOLVED');
                        deferred.resolve();
                    });
            } else {
                deferred.resolve();
            }
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    return deferred.promise;
};

/**
 * expose methods
 */
module.exports = {
    startScan: startScan
};



