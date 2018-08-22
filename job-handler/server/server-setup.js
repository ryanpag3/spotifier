module.exports = () => {
    require('message-queue'); // initial setup
    require('./util/artist-details-handler'); // expose local listeners
};