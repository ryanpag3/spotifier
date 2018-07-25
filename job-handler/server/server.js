const express = require('express');
const logger = require('logger');
const app = express();
const config = require('../config');

require('./server-setup')();

app.listen(config.server.port, () => logger.info('Job handler has been started on port ' + config.server.port));