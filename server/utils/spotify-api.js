const logger = require('./logger');
const config = require('../../config-public');
const pConfig = require('../../config-private');
const SpotifyApiNode = require('spotify-web-api-node');
const Promise = require('bluebird');
const request = require('request-promise');
const DB = require('./db');
const PerformanceStats = require('./performance-stats');

var SPOTIFY_CREDS = process.env.NODE_ENV ? pConfig.spotify : pConfig.test.spotify;
var REDIRECT_URI = (process.env.NODE_ENV ? config.prodUrl : config.url) + '/callback';

module.exports = SpotifyApi;

function SpotifyApi(userRefreshToken, socketUtil) {
    this.socketUtil = socketUtil;
    this.refreshToken = userRefreshToken;
    this.accessToken;
    this.tokenExpiresAt;
    this.api; // reference of SpotifyApiNode object on init()
    this.db = new DB();
    return this;
};

SpotifyApi.prototype.initialize = function () {
    // logger.debug('initializing api object');
    let self = this;
    return this.getSpotifyApi(this.refreshToken)
        .then((api) => {
            self.api = api;
            return;
        });
};

SpotifyApi.prototype.getSpotifyApi = function (userToken) {
    let api = new SpotifyApiNode({
        clientId: pConfig.spotify.client_id,
        clientSecret: pConfig.spotify.client_secret
    });
    return this.setAccessToken(api, userToken)
        .then(() => {
            return api;
        });
};

SpotifyApi.prototype.setAccessToken = function (api, refreshToken) {
    if (!refreshToken) {
        // logger.debug('using client credentials grant type');
        return api.clientCredentialsGrant()
            .then((data) => {
                this.setToken(api, data.body);
            });
    }
    logger.debug('using bearer grant type');
    api.setRefreshToken(refreshToken);
    return api.refreshAccessToken()
        .then((data) => {
            this.setToken(api, data.body);
        });
};

SpotifyApi.prototype.setToken = function (api, tokenBody) {
    this.setTokenExpires(tokenBody.expires_in);
    this.accessToken = tokenBody.access_token;
    if (api) // object not declared yet
        api.setAccessToken(this.accessToken);
    else
        this.api.setAccessToken(this.accessToken);
};

SpotifyApi.prototype.getAccessToken = function () {
    let currTime = new Date();
    if (this.tokenExpiresAt < currTime) {
        // logger.info('resetting token');
        return this.setAccessToken(this.api, this.refreshToken);
    }
};

SpotifyApi.prototype.getServerTokenApi = function () {
    let api = new SpotifyApiNode({
        clientId: pConfig.spotify.client_id,
        clientSecret: pConfig.spotify.client_secret
    });
    return api.clientCredentialsGrant()
        .then((data) => {
            this.setTokenExpires(data.body.expires_in);
            this.accessToken = data.body['access_token'];
            api.setAccessToken(this.accessToken);
        });
};

SpotifyApi.prototype.setTokenExpires = function (expiresIn) {
    let currTime = new Date();
    this.tokenExpiresAt = new Date(currTime.getTime() + expiresIn);
};

SpotifyApi.prototype.getArtistNewRelease = function (artistId) {
    logger.info('getting most recent release for: ' + artistId);
    return this.initialize()
        .then(() => this.getRecentRelease(artistId))
        .catch((err) => {
            err.artistId = artistId;
            err.token = this.refreshToken;
            throw err;
        });
};

SpotifyApi.prototype.getRecentRelease = function (artistId) {
    return this.validateInit()
        .then(() => this.getArtistAlbums(artistId))
        .then((albums) => {
            return this.sortAlbumsByRelease(albums)
        })
        .then((sortedAlbums) => {
            if (sortedAlbums.length > 0) {
                let album = sortedAlbums[0]
                return {
                    spotify_id: artistId,
                    recent_release: {
                        id: album.id,
                        uri: album.uri,
                        title: album.name,
                        release_date: album.release_date,
                        images: album.images,
                        url: album.external_urls.spotify
                    }
                };
            }

            return {
                spotify_id: artistId,
                recent_release: {
                    title: 'No releases currently on Spotify',
                    release_date: '-'
                }
            };
        });
};

SpotifyApi.prototype.getArtistAlbums = function (artistId) {
    let promises = [];
    let albumType = 'album,single';
    return this.validateInit()
        .then(() => this.api.getArtistAlbums(artistId, {
            album_type: albumType
        }))
        .then((data) => {
            return data.body.total;
        })
        .then((total) => {
            for (let offset = 0; offset < total; offset += 50) {
                promises.push({
                    limit: 50,
                    offset: offset,
                    album_type: albumType
                });
            }
        })
        .then(async () => {
            return Promise.map(promises, params => {
                return this.api.getArtistAlbums(artistId, params);
            }, {
                concurrency: 1
            });
        })
        .then((queryResults) => {
            let albums = [];
            for (let i = 0; i < queryResults.length; i++) {
                albums = albums.concat(queryResults[i].body.items);
            }
            return albums;
        });
};

SpotifyApi.prototype.sortAlbumsByRelease = function (albums) {
    return albums.sort((a, b) => {
        let aDate = new Date(a.release_date);
        let bDate = new Date(b.release_date);
        if (aDate < bDate)
            return 1;
        if (bDate < aDate)
            return -1;
        return 0;
    });
}

SpotifyApi.prototype.validateAccessInit = function () {
    let validateAccessToken = true;
    return this.validateInit(validateAccessToken);
};

SpotifyApi.prototype.validateInit = function (validateAccessToken) {
    return new Promise((resolve, reject) => {
        if (!this.api) {
            return reject(new Error('Spotify API object has not been initialized. Has initialize() been called?'));
        }

        if (!this.refreshToken && validateAccessToken && validateAccessToken === true) {
            let err = 'Spotify API has not initialized a valid bearer access token which is required for this request.';
            return reject(err);
        }

        resolve();
    });
}

SpotifyApi.prototype.syncLibrary = function (user) {
    logger.info('library sync has been started for user: ' + user.name);
    return this.initialize()
        .then(() => this.validateAccessInit())
        .then(() => this.getUserArtists())
        .then((artists) => {
            logger.info(`${user.name} has found their artists with length ${artists.length}`);
            return this.db.addAllArtists(user, artists)
        })
        .then(async () => {
            const library = await this.db.getLibrary(user);
            this.socketUtil.alertLibraryAdded(user, library);
        });
};

/**
 * Get all saved artists. Extend as needed if you want to support saved albums/artists, etc.
 */
SpotifyApi.prototype.getUserArtists = function () {
    return this.validateAccessInit()
        .then(() => this.getUserLibraryArtists());
};

SpotifyApi.prototype.getUserLibraryArtists = function () {
    return this.validateAccessInit()
        .then(() => this.getSavedTracks())
        .then((savedTracks) => {
            logger.debug('tracks received with length of ' + savedTracks.length);
            let artistAdded = {};
            let artists = [];
            for (let i = 0; i < savedTracks.length; i++) {
                let track = savedTracks[i];
                let artistId = track.artists[0].id;
                let artistName = track.artists[0].name;
                if (artistAdded[artistId] !== undefined)
                    continue; // already added
                artistAdded[artistId] = true;
                artists.push({
                    spotify_id: artistId,
                    name: artistName
                });
            };
            return artists;
        });
};

SpotifyApi.prototype.getSavedTracks = function () {
    let concurrency = 7; // magic number, bearer limit
    let delay = 0;
    let limit = 50;
    let perfStats = new PerformanceStats('SpotifyApi.getSavedTracks()');
    perfStats.start();
    return this.validateAccessInit()
        .then(() => this.getSavedTracksLength())
        .then((length) => {
            // predetermine offsets
            let offsets = [];
            for (let i = 0; i <= length; i += 50) offsets.push(i);
            return offsets;
        })
        .then((offsets) => Promise.map(offsets, (offset) => {
                return Promise.delay(delay).then(() => this.api.getMySavedTracks({
                        limit: limit,
                        offset: offset
                    })
                    .then((data) => {
                        let tracks = [];
                        for (let i = 0; i < data.body.items.length; i++) {
                            tracks.push(data.body.items[i].track);
                        }
                        return tracks;
                    }));
            }, {
                concurrency: concurrency
            })
            .then((trackMap) => {
                let tracks = [];
                for (let i = 0; i < trackMap.length; i++) {
                    tracks = tracks.concat(trackMap[i]);
                }
                perfStats.finish();
                return tracks;
            }));
};

SpotifyApi.prototype.getSavedTracksLength = function () {
    let limit = 1;
    let offset = 0;
    return this.api.getMySavedTracks({
            limit: limit,
            offset: offset
        })
        .then((data) => {
            return data.body.total;
        });
};

SpotifyApi.prototype.getAlbums = async function (n) {
    // wait this.validateAccessInit();
    const offsets = this.getOffsets(50, n);
    const results = await Promise.map(offsets, async (offset) => {
        await Promise.delay(100);
        return await this.api.search('year:2018', ['album'], {
            limit: 50,
            offset: offset
        });
    }, {
        concurrency: 2
    });
    let r = [];
    results.map((result) => {
        // console.log(result.body.albums.items);
        r = r.concat(result.body.albums.items);
    });
    r = r.slice(0, n);
    return r;
}

SpotifyApi.prototype.getOffsets = function (limit, max) {
    let offset = 0;
    let offsets = [];
    while (offset < max) {
        offsets.push(offset);
        offset += limit;
    }
    return offsets;
}

SpotifyApi.prototype.handleCodeGrant = async function (code, api) {
    // console.log({
    //     clientId: pConfig.spotify.client_id,
    //     clientSecret: pConfig.spotify.client_secret,
    //     redirectUri: REDIRECT_URI
    // })
    // let api = new SpotifyApiNode({
    //     clientId: pConfig.spotify.client_id,
    //     clientSecret: pConfig.spotify.client_secret,
    //     redirectUri: REDIRECT_URI
    // });
    try {
        const data = JSON.parse(await this.authorizeCodeGrant(code));
        console.log(data);
        const {
            expires_in,
            access_token,
            refresh_token
        } = data;
        this.refreshToken = refresh_token;
        this.accessToken = access_token;
        await this.initialize();
        this.api.setAccessToken(this.accessToken);
        const me = await this.api.getMe();
        console.log(me);
    } catch (e) {
        logger.error(e.toString());
    }
}

SpotifyApi.prototype.authorizeCodeGrant = async function (code) {
    const options = {
        method: 'POST',
        headers: {
            'Accept':'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' : 'Basic ' + Buffer.from(SPOTIFY_CREDS.client_id + ':' + SPOTIFY_CREDS.client_secret).toString('base64')
        },
        uri: 'https://accounts.spotify.com/api/token',
        qs: {
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
            code: code
        }
    };
    return request(options);
}

SpotifyApi.prototype.getMe = async function () {
    
}