const pConfig = require('../../private/config-private');
const logger = require('logger');
const expect = require('chai').expect;
let SpotifyApi = require('spotify-api');

describe('spotify-api-test.js', () => {
    it('should set a valid access token with a valid refresh token', (done) => {
        let refreshToken = pConfig.spotify.testRefreshToken;
        let api = new SpotifyApi(refreshToken);
        api.initialize()
            .then(() => {
                try {
                    expect(api.accessToken).to.not.be.undefined;
                    expect(api.api).to.not.be.undefined;
                    expect(api.tokenExpiresAt).to.not.be.undefined;
                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it('should set a valid access token without a refresh token', (done) => {
        let api = new SpotifyApi();
        api.initialize()
            .then(() => {
                try {
                    expect(api.accessToken).to.not.be.undefined;
                    expect(api.api).to.not.be.undefined;
                    expect(api.tokenExpiresAt).to.not.be.undefined;
                    done();
                } catch (e) {
                    done(e);
                }
            });
    });
});