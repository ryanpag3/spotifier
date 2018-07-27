const logger = require('logger');
const messageRoutes = require('./static/message-handler-route.json');

module.exports = {
    handleMessage: (message) => {
        const handler = require('./' + messageRoutes[message.action]);
        handler.handleMessage(message)
            .then((result) => {
                logger.info('Message was successfully handled.');
            })
            .catch((err) => {
                logger.error(err.stack.toString());
            });
    }
}