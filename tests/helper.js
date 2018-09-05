const logger = require('logger');
const {User, Artist} = require('models');
const pConfig = require('../private/config-private');
const REFRESH_TOKEN = pConfig.spotify.testRefreshToken;

module.exports = {
    stageValidUser: function(name) {
        let user = new User({
            name: name,
            email: {
                confirmed: true
            },
            refresh_token: REFRESH_TOKEN,
            sync_queue: {
                status: 'not queued'
            }
        });
        return user.save();
    },

    stageInvalidUser: function() {

    }
};