const mq = require('message-queue');
const logger = require('logger');
const Promise = require('bluebird');
const pConfig = require('../../private/config-private');

describe('artist-details-handler-test.js', function() {
    before(function(done) {
        mq.deleteQueue(mq.ARTIST_DETAILS_QUEUE)
            .then(() => mq.deleteQueue(mq.ARTIST_DETAILS_RESPONSE_Q))
            .then(() => mq.setupQueues())
            .then(() => done());
    });

    after(function(done) {
        mq.getQueueSize(mq.ARTIST_DETAILS_QUEUE)
            .then((size) => {
                logger.info('artist message queue size: ' + size);
            })
            .then(() => mq.getQueueSize(mq.ARTIST_DETAILS_RESPONSE_Q))
            .then((size) => {
                logger.info('artist response message queue size: ' + size)
            })
            .then(() => done());
    })

    it('should be able to handle a large number of requests to the same token without error', function(done) {
        let mq = require('message-queue');
        let timeoutMillis = 10000;
        this.timeout(timeoutMillis * 3); // double for processing
        let server = require('../../job-handler/server/server');
        let runTheJewelsId = '4RnBFZRiMLRyZy0AzzTg2C';
       let numberOfJobs = 5000;
       let promises = [];
        for (let i = 0; i < numberOfJobs; i++) {
            promises.push(i);
        }

        // prevent thread blocking issue with job creation and sending
        Promise.map(promises, (promise) => {
            return Promise.delay(0).then(() => mq.createArtistDetailsJob(runTheJewelsId));
        },{
            concurrency: 100
        }).then((res) => {
            logger.info('job done!');
        });

        // let the handler try it's best
        setTimeout(function() {
            server.stop();
            done();
        }, timeoutMillis)
    });
});