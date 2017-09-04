/**
 * This file holds the cron job definitions.
 */
var CronJob = require('cron').CronJob,
    releaseScanner = require('./new-releases'),
    Db = require('./db');

// only run these jobs in production environment
if (process.env.NODE_ENV) {
    // CHECK FOR NEW RELEASES
    // RUNS AT 4AM 7 DAYS A WEEK
    new CronJob('00 00 04 * * 0-6', function () {
            console.log('starting new release scan job!');
            releaseScanner.startScan(true); // true flags send emails
        },
        null, // callback
        true, // start job right now
        'America/Los_Angeles'); // set time zone

    // CHECK FOR MISSING ARTIST DETAILS
    // RUNS ONCE A WEEK ON SUNDAYS
    new CronJob('00 00 24 * * 0', function () {
            console.log('running validate artist details job!');
            var db = new Db();
            db.validateArtistDetails();
        },
        null,
        true,
        'America/Lost_Angeles')
}
