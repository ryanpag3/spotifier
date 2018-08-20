const pConfig = require('../../private/config-private');
const logger = require('logger');
const expect = require('chai').expect;
let SpotifyApi = require('spotify-api');

describe('spotify-api-test.js', () => {
    let REFRESH_TOKEN = pConfig.spotify.testRefreshToken;
    it('should set a valid access token with a valid refresh token', function(done) {
        let api = new SpotifyApi(REFRESH_TOKEN);
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

    it('should set a valid access token without a refresh token', function(done) {
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

    it ('should grant a new token when the current one is expired', function(done) {
        let api = new SpotifyApi();
        api.initialize()
            .then(() => {
                // now take a step back and slide real smooth
                api.tokenExpiresAt = new Date(api.tokenExpiresAt.getTime() - 3601);
                return api.getAccessToken();
            })
            .then(() => {
                try {
                    expect(api.tokenExpiresAt).to.be.greaterThan(new Date());
                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it ('should get an artists most recent release with client token', function(done) {
        this.timeout(3000);
        let artistId = '4RnBFZRiMLRyZy0AzzTg2C'; // RTJ!
        let api = new SpotifyApi();
        api.getArtistNewRelease(artistId)
            .then((release) => {
                expect(release.spotify_id).to.be.equal(artistId);
                expect(release.recent_release).to.not.be.undefined;
                done();
            });
    });

    it('should get an artists most recent release with a user token', function(done) {
        this.timeout(3000);
        let artistId = '4RnBFZRiMLRyZy0AzzTg2C'; // RTJ!
        let api = new SpotifyApi(REFRESH_TOKEN);
        api.getArtistNewRelease(artistId)
            .then((release) => {
                expect(release.spotify_id).to.be.equal(artistId);
                expect(release.recent_release).to.not.be.undefined;
                done();
            });
    })
});