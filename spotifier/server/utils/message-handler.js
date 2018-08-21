const logger = require('logger');
const mq = require('message-queue');
var RSMQWorker = require("rsmq-worker");
var artistDetailsWorker = new RSMQWorker(mq.ARTIST_DETAILS_RESPONSE_Q);
let Db = require('./db');


module.exports = function (socketUtil) {
    artistDetailsWorker.on("message", function (msg, next, id) {
        logger.info('message received');
        try {
            msg = JSON.parse(msg);
        } catch (e) {
            logger.error(e);
        }

        if (socketUtil) {
            socketUtil.alertArtistDetailsChange(msg.details);
        }
        let db = new Db();
        db.updateArtist(msg.details);
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

    logger.info('starting artist details RESPONSE worker');
    artistDetailsWorker.start();
}