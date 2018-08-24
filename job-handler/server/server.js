const express = require('express');
const logger = require('logger');
const app = express();
const config = require('../config');

require('./server-setup')();

let server = app.listen(config.server.port, () => logger.info('Job handler has been started on port ' + config.server.port));

let s = {
    stop: () => {
        logger.info('closing job handler server...');
        return server.close(function() {
            logger.info('server closed!');
        });
    }
}

module.exports = s;