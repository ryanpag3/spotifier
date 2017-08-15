var CronJob = require('cron').CronJob,
    Q = require('q'),
    Artist = require('../models/artist'),
    Db = require('../utils/db-wrapper'),
    getArtistDetailsQueue = require('./queue-get-artist-details'),
    syncLibraryQueue = require('./queue-sync-user-library'),
    spotifyApiServer = require('../utils/spotify-server-api');


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
// var job = new CronJob('* * * * * 1-7', function() {
//         console.log('starting job!'); // todo
//         scan();
//     },
//     null,
//     true, // start job right now
//     'America/Los_Angeles'); // set time zone

function scan() {
    var deferred = Q.defer();
    var db = new Db();
    // query for all artists
    db.getAllArtists()
        .then(function (artists) {
            // if empty
            if (artists.length === 0) {
                console.log('artist list empty?');
                deferred.resolve();
            }

            var i = 0;
            function processArtist() {
                var mArtist = artists[i];
                console.log(i + '. ' + mArtist.name);
                spotifyApiServer.getRecentReleaseId(mArtist)
                    .then(function (albumId) {
                        if (i === 20) {
                            albumId = '1234';
                        }
                        Artist.findOne(
                            {'_id': mArtist._id}, function (err, artist) {
                                if (artist.recent_release.id !== albumId && artist.recent_release.id !== undefined) {
                                    console.log('THIS IS A NEW RELEASE!!!!');
                                    spotifyApiServer.getAlbumInfo(albumId)
                                        .then(function (album) {
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        })
                                }
                            });

                    });
                if (++i < artists.length-1) {
                    setTimeout(processArtist, 150);
                } else {
                    console.log('finished checking for new releases!');
                    deferred.resolve();
                }
            }
            // start recursive call
            processArtist();
        });
    return deferred.promise;
}

module.exports = {
    startScan: function () {
        syncLibraryQueue.pause();
        getArtistDetailsQueue.pause();
        scan()
            .then(function () {
                syncLibraryQueue.resume();
                getArtistDetailsQueue.resume();
            })
            .catch(function(err) {
                console.log(err);
            })
    }
};



