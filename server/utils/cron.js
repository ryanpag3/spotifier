/**
 * This file holds the cron job definitions.
 */
var CronJob = require('cron').CronJob,
    releaseScanner = require('./new-releases'),
    Db = require('./db'),
    logger = require('./logger');
    syncLibraryQueue = require('./queue-sync-user-library');

// only run these jobs in production environment
if (process.env.NODE_ENV) {

    new CronJob('00 30 5 * * 0-6', function () {
            var sendEmails = true;
            logger.info('starting new release scan job!');
            releaseScanner.startScan(sendEmails);
        },
        null, // callback
        true, // start job right now
        'America/Los_Angeles'); // set time zone

    new CronJob('00 00 00 * * 0-6', function () {
            logger.info('running validate artist details job!');
            var db = new Db();
            db.validateArtistDetails();

            logger.info('running scheduled library syncs');
            syncLibraryQueue.enqueueScheduledSyncs()
                .then(function() {
                    logger.info('syncs have been scheduled');
                });
        },
        null,
        true,
        'America/Los_Angeles')
}
