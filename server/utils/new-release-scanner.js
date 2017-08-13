var CronJob = require('cron').CronJob,
    Q = require('q'),
    Artist = require('../models/artist'),
    Db = require('../utils/db-wrapper'),
    getArtistDetailsQueue = require('./queue-get-artist-details'),
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
            var i = 0;
            go();

            function go() {
                spotifyApiServer.getRecentReleaseId(artists[i])
                    .then(function (albumId) {
                        Artist.findOne({'_id': artists[i]._id}, {'recent_release.id': albumId}, function (err, artist) {
                            if (artist === null) {
                                spotifyApiServer.getAlbumInfo(albumId)
                                    .then(function (album) {
                                        console.log(album.name);
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                    })
                            } else {
                                console.log('no recent release found');
                            }
                        })
                    });
                if (++i < artists.length) {
                    // go();
                    setTimeout(go, 150);
                } else {
                    deferred.resolve();
                    console.log('DONE DONE DONE DONE DONE');
                }
            }
        });
    return deferred.promise;
}

module.exports = {
    startScanner: function () {
        setTimeout(function () {
            getArtistDetailsQueue.pause();
            // job.start();
            scan()
                .then(function () {
                    getArtistDetailsQueue.resume();
                })
        }, 30000);

    }
};



