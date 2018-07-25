module.exports = () => {
    require('message-queue'); // initial setup
    require('./util/message-queue'); // expose local listeners
};