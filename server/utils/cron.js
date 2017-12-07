/**
 * This file holds the cron job definitions.
 */
var CronJob = require('cron').CronJob,
    releaseScanner = require('./new-releases'),
    Db = require('./db'),
    logger = require('./logger');

// only run these jobs in production environment
if (process.env.NODE_ENV) {

    new CronJob('00 00 7 * * 0-6', function () {
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
        },
        null,
        true,
        'America/Los_Angeles')
}
