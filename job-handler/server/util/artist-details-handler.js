const handlerUtil = require('./job-handler-util');
const logger = require('logger');
const mq = require('message-queue');
let RSMQWorker = require("rsmq-worker");
let RSMQPromise = require('rsmq-promise');
let artistDetailsWorker = new RSMQWorker(mq.ARTIST_DETAILS_QUEUE);
let SpotifyApi = require('spotify-api');
let pConfig = require('../../../private/config-private');

let rsmq = new RSMQPromise({
    host: pConfig.redis.host,
    port: pConfig.redis.port
});

artistDetailsWorker.on("message", function (msg, next, id) {
    try {
        msg = JSON.parse(msg);
    } catch (e) {
        logger.error(e);
    }

    let api = new SpotifyApi(msg.token);
    api.getArtistNewRelease(msg.artist_id)
        .then((release) => mq.createArtistDetailsResponse(release))
        .catch((err) => {
            logger.error('*** ' + JSON.stringify(err));
            logger.info('RETRYING WITH ID: ' + err.artistId);
            mq.createArtistDetailsJob(err.artistId, err.token);
        });


    setTimeout(function () {
        try {
            next();
        } catch (e) {
            // library throws uncaught exception if you are running worker while closing job
            if (!e.toString().toLowerCase().includes('deletemessage'))
                logger.error(e.toString());
        }
    }, 50);

});

// optional error listeners
artistDetailsWorker.on('error', function (err, msg) {
    rsmq.getQueueAttributes({
            qname: mq.ARTIST_DETAILS_QUEUE
        })
        .then((attrs) => {
            logger.debug('Current queue size: ' + attrs.msgs);
        });
    // logger.error(err.toString().toLowerCase().includes('too many requests'));
    // if (!err.toString().toLowerCase().includes('too many requests'))
    logger.error(err.toString());
    // try again
    let nextAttempt = msg.attempt + 1;
    mq.createArtistDetailsJob(msg.artist_id, msg.token, nextAttempt);
    logger.error(":) ERROR", msg.id);
});
artistDetailsWorker.on('exceeded', function (msg) {
    console.log("EXCEEDED", msg.id);
});
artistDetailsWorker.on('timeout', function (msg) {
    console.log("TIMEOUT", msg.id, msg.rc);
});

logger.info('starting artist details worker');
artistDetailsWorker.start();

module.exports = artistDetailsWorker;