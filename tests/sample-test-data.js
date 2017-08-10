/**
 * contains sample test cases to use on unit tests
 * @type {[null]}
 */
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

    failUser:  function() {
        return {}
    },

    // this user will pass creation but fail email checks
    failEmailUser: function() {
        return {
            name: 'emailFailUser'
        }
    },

    passUser: function() {
        return {
            name: 'user',
            email: {
                address: 'myemail@email.com',
                confirmed: true
            }
        }
    }
};

