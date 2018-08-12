const messageQueue = require('message-queue');
const expect = require('chai').expect;
const RSMQPromise = require('rsmq-promise');

describe('message-queue.js', () => {
    it ('should create a artist details message', (done) => {
        messageQueue.createArtistDetailsJob('1234', 'token')
            .then(() => messageQueue.consumeArtistDetailsJob())
            .then((message) => {
                expect(message).to.not.be.undefined;
                done();
            });
    });

    it ('should create a sync-library message', (done) => {
        
    })
});