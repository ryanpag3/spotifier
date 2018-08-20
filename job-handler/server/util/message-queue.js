const logger = require('logger');
var RSMQWorker = require("rsmq-worker");
var artistDetailsWorker = new RSMQWorker("getartistdetails-handler");
let SpotifyApi = require('spotify-api');

artistDetailsWorker.on("message", function (msg, next, id) {
    let api = new SpotifyApi();
    logger.info("Message id : " + id);
    logger.info(JSON.stringify(msg));


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