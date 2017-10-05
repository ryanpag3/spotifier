/**
 * contains sample test cases to use on unit tests
 * @type {[null]}
 */
var privateConfig = require('../private/config-private'),
    moniker = require('moniker'),
    potNames = moniker.generator([moniker.noun]);
module.exports = {

    failArtist: function () {
        return {};
    },

    passArtist: function () {
        return {
            spotify_id: '123456789',
            name: 'passArtist',
            recent_release: {
                id: '1234',
                title: 'album title',
                release_date: 'release date',
                images: []
            }
        }
    },

    failArtists: function () {
        return [{}, {}, {}, {}];
    },

    passArtists: function () {
        return [{
            spotify_id: '123456789',
            name: 'passArtists',
            recent_release: {
                id: '1234',
                title: 'album title',
                release_date: 'release date',
                images: []
            }
        }]
    },
    // has two artists with new releases pending and two artists that are current
    newReleaseArtists: function () {
        return [
            { // out of date
                spotify_id: '6l3HvQ5sa6mXTsMTB19rO5',
                name: 'J. Cole',
                recent_release: {
                    id: '1yZC8xZwv4gsmCZ4p4JWdI',
                    title: 'Forest Hills Drive: Live from Fayetteville, NC',
                    release_date: '2016-01-28'
                }
            },
            {
                spotify_id: '17lzZA2AlOHwCwFALHttmp',
                name: '2 Chainz',
                recent_release: {
                    id: '3DiL3a7eQef1sDc8DMvj50',
                    title: 'Pretty Girls Like Trap Music',
                    release_date: '2017-06-16'
                }
            },
            { // out of date
                spotify_id: '2fSaE6BXtQy0x7R7v9IOmZ',
                name: 'Aesop Rock',
                recent_release: {
                    id: '1An1m0S3ZdQy9Uuo476D12',
                    title: 'The Impossible Kid',
                    release_date: '2016-04-29'
                }
            },
            {
                spotify_id: '13ubrt8QOOCPljQ2FL1Kca',
                name: 'A$AP Rocky',
                recent_release: {
                    id: '5b6HBIqolYQCK29Ma4tVqP',
                    title: 'AT.LONG.LAST.A$AP',
                    release_date: '2015-06-17'
                }
            }
        ]
    },

    // fail all user tests
    failUser: function () {
        return {}
    },

    // pass creation but fail email checks
    failEmailUser: function () {
        return {
            name: 'emailFailUser'
        }
    },

    // pass email created but fail confirmed
    unconfirmedUser: function () {
        return {
            name: 'unconfirmed-user',
            email: {
                address: privateConfig.gmail.username,
                confirmed: false
            }
        }
    },

    // pass all user tests
    passUser: function () {
        return {
            name: potNames.choose(),
            email: {
                address: privateConfig.gmail.username,
                confirmed: true
            }
        }
    },

    // pass all user tests and check for multiple email functionality
    passUser2: function () {
        return {
            name: potNames.choose(),
            email: {
                address: privateConfig.gmail.username,
                confirmed: true
            }
        };
    },

    unsubscribedUser: function () {
        return {
            name: potNames.choose(),
            email: {},
            saved_artists: []
        };
    },

    spotifyAuthenticatedUser: function() {
        return {
            name: potNames.choose(),
            email: {
                address: privateConfig.gmail.username,
                confirmed: true
            },
            refresh_token: privateConfig.spotify.testRefreshToken
        };
    }
};

