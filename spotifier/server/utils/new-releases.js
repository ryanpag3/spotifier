var CronJob = require('cron').CronJob,
    Q = require('q'),
    Artist = require('../models/artist'),
    Db = require('./db'),
    getArtistDetailsQueue = require('./queue-get-artist-details'),
    syncLibraryQueue = require('./queue-sync-user-library'),
    spotifyApiServer = require('../utils/spotify-server-api'),
    emailHandler = require('./email'),
    logger = require('./logger'),
    playlistHandler = require('./playlist-handler');


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
 *  todo: refactor to limit code duplication
 * */
function scan() {
    logger.info('scan started!');
    var deferred = Q.defer();
    spotifyApiServer.getNewReleases()
        .then(function (releases) {
            var db = new Db();
            var releaseSpotifyIds = Object.keys(releases); // grab all spotify ids for iteration
            var i = 0;
            run(); // initialize
            function run() {
                // extract spotify_id's for iteration
                var artistReleaseTitles = releases[releaseSpotifyIds[i]].map(function (e) {
                    return e.recent_release.title.toLowerCase();
                });
                // query for artist by spotify_id
                Artist.findOne({
                    'spotify_id': releaseSpotifyIds[i]
                }, function (err, artist) {
                    if (err) {
                        logger.error('mongo error thrown!');
                        logger.error(err.toString());
                    }
                    // if exists and has a recent_release that has been set
                    if (artist !== null && artist.recent_release.id !== undefined) {
                        logger.info('checking ' + artist.name + ' for release data.');
                        if (artistReleaseTitles.length > 1) { // if artist has multiple releases in past two weeks
                            spotifyApiServer.getRecentRelease(artist)
                                .then(function (album) {
                                    // todo: move this code block to it's own method
                                    var release = {
                                        id: album.id,
                                        title: album.name,
                                        release_date: album.release_date,
                                        images: album.images,
                                        url: album.external_urls.spotify
                                    };

                                    release.release_date = new Date(release.release_date);
                                    artist.recent_release.release_date = new Date(artist.recent_release.release_date);

                                    // TODO: remove when done debugging
                                    logger.debug('title check: ' + (removeSpecial(release.title).toLowerCase() !== removeSpecial(artist.recent_release.title).toLowerCase()));
                                    logger.debug('date check: ' + release.release_date + ' > ' + artist.recent_release.release_date + ' : ' + (release.release_date > artist.recent_release.release_date));
                                    
                                    // if titles do not match and release date is more present
                                    if (removeSpecial(release.title).toLowerCase() !==
                                        removeSpecial(artist.recent_release.title).toLowerCase() &&
                                        release.release_date > artist.recent_release.release_date) {
                                        logger.info('--------');
                                        logger.info('release found!');
                                        logger.info(artist.name + ' | ' + release.title);
                                        logger.info('--------');
                                        // update artist document with new release and flag for notification
                                        Artist.findOneAndUpdate({
                                                '_id': artist._id
                                            }, {
                                                'recent_release': release
                                            },
                                            function (err, artist) {
                                                getArtistDetailsQueue.createJob(artist);
                                            });
                                        db.artistNewReleaseFound(artist);
                                    }
                                    // todo: fix code duplication
                                    i++; // move pointer right
                                    if (i < releaseSpotifyIds.length) { // if we have not checked all new releases
                                        logger.info(i + '/' + releaseSpotifyIds.length);
                                        run();
                                    } else {
                                        logger.info('done processing new releases!');
                                        deferred.resolve();
                                    }
                                })
                                .catch(function (err) {
                                    logger.error(err.toString());
                                    run();
                                })
                        } else {
                            var release = releases[releaseSpotifyIds[i]][0].recent_release;
                            if (removeSpecial(release.title).toLowerCase() !==
                                removeSpecial(artist.recent_release.title).toLowerCase()) {
                                spotifyApiServer.getAlbumInfo(release)
                                    .then(function (album) {
                                        var currentDate = new Date();
                                        album.release_date = new Date(album.release_date);
                                        artist.recent_release.release_date = new Date(artist.recent_release.release_date);
                                        logger.debug(album.release_date + ' > ' + artist.recent_release.release_date + ' :' + (album.release_date > artist.recent_release.release_date))
                                        logger.debug(album.release_date  + ' <= ' + currentDate + ' :' + (album.release_date.getTime() <= currentDate.getTime()));
                                        if ((album.release_date > artist.recent_release.release_date) && (album.release_date.getTime() <= currentDate.getTime())) {
                                            // todo: move this code block to it's own method

                                            release = {
                                                id: album.id,
                                                title: album.name,
                                                release_date: album.release_date,
                                                images: album.images,
                                                url: album.external_urls.spotify
                                            };
                                            logger.info('release found!');
                                            logger.info('--------');
                                            logger.info(artist.name + ' | ' + release.title);
                                            logger.info('--------');
                                            Artist.findOneAndUpdate({
                                                    '_id': artist._id
                                                }, {
                                                    'recent_release': release
                                                },
                                                function (err, artist) {
                                                    getArtistDetailsQueue.createJob(artist);
                                                });
                                            db.artistNewReleaseFound(artist);
                                        }
                                        // todo: fix code duplication
                                        i++; // move pointer right
                                        if (i < releaseSpotifyIds.length) { // if we have not checked all new releases
                                            logger.info(i + '/' + releaseSpotifyIds.length);
                                            run();
                                        } else {
                                            logger.info('done processing new releases!');
                                            deferred.resolve();
                                        }
                                    })
                                    .catch(function (err) {
                                        logger.error(err.toString());
                                        run();
                                    });
                            } else {
                                // TODO: fix code duplication
                                i++; // move pointer right
                                if (i < releaseSpotifyIds.length) { // if we have not checked all new releases
                                    run();
                                } else {
                                    logger.info('done processing new releases!');
                                    deferred.resolve();
                                }
                            }
                        }
                    } else {
                        // todo: fix code duplication
                        i++; // move pointer right
                        if (i < releaseSpotifyIds.length) { // if we have not checked all new releases
                            run();
                        } else {
                            logger.info('done processing new releases!');
                            deferred.resolve();
                        }
                    }
                })
            }
        })
        .catch(function (err) {
            logger.error(err.toString());
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
            playlistHandler.updateNewReleasePlaylists()
                .then(function () {
                    // resume job queues
                    syncLibraryQueue.resume();
                    getArtistDetailsQueue.resume();
                    if (sendEmails === true) {
                        // send new release emails
                        emailHandler.sendNewReleaseEmails()
                            .then(function () {
                                logger.info('EMAIL SERVICE RESOLVED');
                                deferred.resolve();
                            });
                    } else {
                        deferred.resolve();
                    }
                })
                .catch(function (err) {
                    logger.error(err.toString());
                    deferred.reject(err);
                });

        })
        .catch(function (err) {
            logger.error(err.toString());
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

// HELPER FUNCTIONS

//return true if char is a number
function isNumber(text) {
    reg = new RegExp('[0-9]+$');
    if (text) {
        return reg.test(text);
    }
    return false;
}

// strip special characters && ignore numbers
function removeSpecial(text) {
    if (text) {
        var lower = text.toLowerCase();
        var upper = text.toUpperCase();
        var result = "";
        for (var i = 0; i < lower.length; ++i) {
            if (isNumber(text[i]) || (lower[i] != upper[i]) || (lower[i].trim() === '')) {
                result += text[i];
            }
        }
        return result;
    }
    return '';
}