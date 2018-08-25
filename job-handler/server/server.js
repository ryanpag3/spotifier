const express = require('express');
const logger = require('logger');
const app = express();
const config = require('../config');
const artistDetailsHandler = require('./util/artist-details-handler');

require('./server-setup')();

let server = app.listen(config.server.port, () => logger.info('Job handler has been started on port ' + config.server.port));

let s = {
    stop: () => {
        logger.info('closing job handler server...');
        return server.close(function() {
            logger.info('server closed!');
            artistDetailsHandler.quit();
        });
    }
}

module.exports = s;