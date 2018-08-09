const logger = require('logger');
var RSMQWorker = require("rsmq-worker");
var worker = new RSMQWorker("getartistdetails-handler");

worker.on("message", function (msg, next, id) {
    logger.info("Message id : " + id);
    logger.info(JSON.stringify(msg));
    next();
});

// optional error listeners
worker.on('error', function (err, msg) {
    console.log("ERROR", err, msg.id);
});
worker.on('exceeded', function (msg) {
    console.log("EXCEEDED", msg.id);
});
worker.on('timeout', function (msg) {
    console.log("TIMEOUT", msg.id, msg.rc);
});

logger.info('starting worker');
worker.start();