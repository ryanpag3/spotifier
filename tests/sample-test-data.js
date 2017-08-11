/**
 * contains sample test cases to use on unit tests
 * @type {[null]}
 */
var privateConfig = require('../config-private');
module.exports = {

    failArtist: function() {
        return {};
    },

    passArtist: function() {
        return {
            spotify_id: '123456789',
            name: 'artist1',
            recent_release: {
                id: '1234',
                title: 'album title',
                release_date: 'release date',
                images: []
            }
        }
    },

    failArtists: function() {
        return [{},{},{},{}];
    },

    passArtists: function() {
        return [{
            spotify_id: '123456789',
            name: 'artist1',
            recent_release: {
                id: '1234',
                title: 'album title',
                release_date: 'release date',
                images: []
            }
        }]
    },

    // fail all user tests
    failUser:  function() {
        return {}
    },

    // pass creation but fail email checks
    failEmailUser: function() {
        return {
            name: 'emailFailUser'
        }
    },

    // pass email created but fail confirmed
    unconfirmedUser: function() {
        return {
            name: 'unconfirmed-user',
            email: {
                address: privateConfig.gmail.username,
                confirmed: false
            }
        }
    },

    // pass all user tests
    passUser: function() {
        return {
            name: 'user',
            email: {
                address: privateConfig.gmail.username,
                confirmed: true
            }
        }
    }
};

