const messageQueue = require('message-queue');
const RSMQPromise = require('rsmq-promise');

describe('message-queue.js', () => {
    it ('should create a artist details message', (done) => {
        messageQueue.createArtistDetailsJob('1234', 'token')
            .then(() => done());
    });
});