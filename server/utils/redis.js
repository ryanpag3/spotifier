const bluebird = require('bluebird');
const redis = require('redis');
const logger = require('./logger');
bluebird.promisifyAll(redis);
const client = redis.createClient();

module.exports = {
    async flushall() {
        const res = await client.flushall('async');
        logger.debug(`Redis flushall successful: ${res}`);
        return;
    }
}