/**
 * load config from environment when running CI build
 */
console.log(process.env.TRAVIS_CI === true)
if (process.env.TRAVIS_CI && process.env.TRAVIS_CI === true) {
    module.exports = getTravisConfig();
} else {
    const config = require('./private/config.json');
    validateSpotifyClient(config);
    module.exports = config;
}

function validateSpotifyClient(config) {
    if (process.env.NODE_ENV) {
        return;
    }
    config.client_id = config.test.spotify.client_id;
    config.client_secret = config.test.spotify.client_secret;
}

/**
 * build configuration from environment variables
 */
function getTravisConfig() {
    console.log('building travis config');
    const config = {};

    config['server_ip'] = process.env.SERVER_IP;

    config['db'] = {
        ip: process.env.DB_IP,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    };

    config['redis'] = {
        host: process.env.REDIS_HOST,
        post: process.env.REDIS_PORT
    };

    config['spotify'] = {
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET
    };

    config['aws'] = {
        secret_id: process.env.AWS_SECRET_ID,
        secret_key: process.env.AWS_SECRET_KEY
    };

    config['gmail'] = {
        user: process.env.GMAIL_USER,
        password: process.env.GMAIL_PASSWORD
    };

    config['test'] = {
        db: {
            ip: process.env.DB_IP,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        },
        spotify: {
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            user: {
                id: process.env.SPOT_TEST_USER,
                refresh_token: process.env.SPOT_USER_REFRESH_TOKEN,
                playlist_id: process.env.SPOT_USER_PLAYLIST_ID
            }
        }
    }

    return config;
}