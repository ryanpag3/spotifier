const handlerUtil = require('./job-handler-util');
const logger = require('logger');
const mq = require('message-queue');
let RSMQWorker = require("rsmq-worker");
let rsmq = require('rsmq-promise');
let artistDetailsWorker = new RSMQWorker(mq.ARTIST_DETAILS_QUEUE);
let SpotifyApi = require('spotify-api');

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
            rsmq.getQueueAttributes({qname: mq.ARTIST_DETAILS_QUEUE})
                .then((attrs) => {
                    logger.debug('Current queue size: ' + attrs.msgs);
                });
            // logger.error(err.toString().toLowerCase().includes('too many requests'));
            if (!err.toString().toLowerCase().includes('too many requests'))
                logger.error(err.toString());
            // try again
            setTimeout(() => {
                let nextAttempt = msg.attempt + 1;
                mq.createArtistDetailsJob(msg.artist_id, msg.token, nextAttempt);
            }, handlerUtil.getBackoff(msg.attempt));
        });
    next();
});

// optional error listeners
artistDetailsWorker.on('error', function (err, msg) {
    console.log("ERROR", err, msg.id);
});
artistDetailsWorker.on('exceeded', function (msg) {
    console.log("EXCEEDED", msg.id);
});
artistDetailsWorker.on('timeout', function (msg) {
    console.log("TIMEOUT", msg.id, msg.rc);
});

logger.info('starting artist details worker');
artistDetailsWorker.start();