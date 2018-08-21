const messageQueue = require('message-queue');
const expect = require('chai').expect;
const RSMQPromise = require('rsmq-promise');
const testHelper = require('test-helper');
const logger = require('logger');

describe('message-queue.js', () => {
    // it('should create a artist details message', function (done) {
    //     messageQueue.createArtistDetailsJob('1234', 'token')
    //         .then(() => messageQueue.consumeArtistDetailsJob())
    //         .then((message) => {
    //             expect(message).to.not.be.undefined;
    //             done();
    //         });
    // });

    it('should get artist details when a valid artist details message is created', function (done) {
        this.timeout(30000);
        require('../../job-handler/server/server');

        messageQueue.createArtistDetailsJob(testHelper.ARTIST_ID, undefined)
            .then(() => messageQueue.consumeArtistDetailsResponse())
            .then((msg) => {
                setTimeout(function () {
                    logger.debug(JSON.stringify(msg, null, 1));
                    expect(msg.details.spotify_id).to.be.equal(testHelper.ARTIST_ID);
                    expect(msg).to.not.be.undefined;
                    done();
                }, 10);
            });
    });
});