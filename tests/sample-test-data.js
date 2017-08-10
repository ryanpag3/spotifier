/**
 * contains sample test cases to use on unit tests
 * @type {[null]}
 */
// fail single artist
module.exports.failArtist = function() {
    return {};
};

// pass single artist
module.exports.passArtist = function() {
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
};

// fail array of artists
module.exports.failArtists = function() {
    return [{},{},{},{}];
};

// pass array of artists
module.exports.passArtists = function() {
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
};

// fail single user
module.exports.failUser = function() {
    return {}
};

// pass single user
module.exports.passUser = function() {
    return {
        name: 'user'
    }
};