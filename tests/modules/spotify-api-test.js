const pConfig = require('../../private/config-private');
const logger = require('logger');
let SpotifyApi = require('spotify-api');

describe('spotify-api-test.js', () => {
    it('should set a valid access token with a valid refresh token', () => {
        let refreshToken = pConfig.spotify.testRefreshToken;
        let api = new SpotifyApi(refreshToken);
        logger.info(api.refreshToken)
        api.initializeApi();
    });
});