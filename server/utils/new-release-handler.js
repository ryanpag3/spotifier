var CronJob = require('cron').CronJob,
    Q = require('q'),
    Artist = require('../models/artist'),
    Db = require('../utils/db-wrapper'),
    getArtistDetailsQueue = require('./queue-get-artist-details'),
    syncLibraryQueue = require('./queue-sync-user-library'),
    spotifyApiServer = require('../utils/spotify-server-api'),
    emailHandler = require('../utils/email-handler');


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
    spotifyApiServer.getNewReleases()
        .then(function(releases) {
            // iterate through releases in past two weeks
            for (var i = 0; i < releases.length; i++) {
                // query for artist with matching spotify id
                // and an album releases id that doesnt match
                Artist.findOne({
                    'spotify_id': releases[i].spotify_id,
                    'recent_release.id': {$nin: [releases[i].recent_release.id, null]}
                }, function(err, artist) {
                    if (artist !== null) {
                        console.log('new release found!');
                    }
                })
            }
        });
    // query for all artists
    // db.getAllArtists()
    //     .then(function (artists) {
    //         // if empty
    //         if (artists.length === 0) {
    //             console.log('artist list empty?');
    //             deferred.resolve();
    //         }
    //
    //         var i = 0;
    //         function processArtist() {
    //             var mArtist = artists[i];
    //             // request recent release id from spotify
    //             spotifyApiServer.getRecentReleaseId(mArtist)
    //                 .then(function (albumId) {
    //                     // query for artist in db
    //                     Artist.findOne(
    //                         {'_id': mArtist._id}, function (err, artist) {
    //                             // if recent release id does not match db id and recent release id exists
    //                             if (artist.recent_release.id !== albumId && artist.recent_release.id !== undefined) {
    //                                 // get details on new release
    //                                 spotifyApiServer.getAlbumInfo(albumId)
    //                                     .then(function (album) {
    //                                         // update artist recent release in db
    //                                         artist.recent_release = {
    //                                             id: album.id,
    //                                             title: album.name,
    //                                             release_date: album.release_date
    //                                         };
    //                                         artist.save();
    //                                         // push new release notification to all users tracking artist
    //                                         db.artistNewReleaseFound(artist);
    //                                     })
    //                                     .catch(function (err) {
    //                                         // todo turn into debug report
    //                                         console.log(err);
    //                                     })
    //                             }
    //                         });
    //
    //                     if (i++ < artists.length-1) {
    //                         setTimeout(processArtist, 150);
    //                     } else {
    //                         console.log('finished checking for new releases!');
    //                         deferred.resolve();
    //                     }
    //                 });
    //         }
    //         // start recursive call
    //         processArtist();
    //     });
    deferred.resolve();
    return deferred.promise;
}

module.exports = {
    startScan: function () {
        var deferred = Q.defer();
        // pause job queues
        syncLibraryQueue.pause();
        getArtistDetailsQueue.pause();
        // scan for new releases
        scan()
            .then(function () {
                // send new release emails
                emailHandler.sendNewReleaseEmails();
                // resume job queues
                syncLibraryQueue.resume();
                getArtistDetailsQueue.resume();
                deferred.resolve();
            })
            .catch(function(err) {
                deferred.reject(err);
            });
        return deferred.promise;
    }
};



