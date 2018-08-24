const mq = require('message-queue');
const logger = require('logger');
const pConfig = require('../../private/config-private');

describe('artist-details-handler-test.js', function() {
    before(function(done) {
        mq.deleteQueue(mq.ARTIST_DETAILS_QUEUE)
            .then(() => mq.deleteQueue(mq.ARTIST_DETAILS_RESPONSE_Q))
            .then(() => done());
    });

    it('should be able to handle a large number of requests to the same token without error', function(done) {
        let timeoutMillis = 60000;
        this.timeout(timeoutMillis * 2); // double for processing
        let server = require('../../job-handler/server/server'); // 
        let runTheJewelsId = '4RnBFZRiMLRyZy0AzzTg2C';
        let numberOfJobs = 100000;
        for (let i = 0; i < numberOfJobs; i++) {
            mq.createArtistDetailsJob(runTheJewelsId);
        }

        logger.info('FINISHED CREATING JOBS');

        // let the handler try it's best
        setTimeout(function() {
            logger.info('*****************************************WE ARE TIMING OUT NOW********************************');
            server.stop();
            done();
        }, timeoutMillis)
    });
});