const logger = require('logger');
const mq = require('message-queue');
var RSMQWorker = require("rsmq-worker");
var artistDetailsWorker = new RSMQWorker(mq.ARTIST_DETAILS_QUEUE);
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
            logger.error(err.toString());
            // try again
            setTimeout(() => {
                mq.createArtistDetailsJob(msg.artist_id, msg.token);
            }, 1000);
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