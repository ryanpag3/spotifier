/** This file handles all the client authenticated calls to the spotify api. **/
var SpotifyApi = require('spotify-web-api-node'),
    Q = require('q'),
    fs = require('fs'),
    path = require('path'),
    Promise = require('bluebird'),
    logger = require('./logger'),
    configPrivate = require('../../private/config-private'),
    credentials = {
        clientId: configPrivate.spotify.clientId,
        clientSecret: configPrivate.spotify.clientSecret
    },
    spotifyApi = new SpotifyApi(credentials); // instantiate api object

var self = module.exports = {

    /**
     * Refresh the client token to ensure proper client authorization to spotify api
     */
    refreshClientToken: function () {
        var deferred = Q.defer();
        // request new access token
        spotifyApi.clientCredentialsGrant()
            .then(function (data) {
                // apply
                spotifyApi.setAccessToken(data.body.access_token);
                deferred.resolve();
            })
            .catch(function (err) {
                logger.error(err);
                deferred.reject(err);
            });
        return deferred.promise;
    },

    /**
     * Get the most recent release for a certain artist. 
     */
    getRecentRelease: function (artist) {
        var deferred = Q.defer();
        // ensure fresh token
        self.refreshClientToken()
            .then(function () {

                //  get releases for parsing
                self.getArtistReleases(artist)
                    .then(function (releases) {
                        var releases = self.getReleaseTypes(releases);
                        self.getMostRecentDetails(releases)
                            .then(function (mostRecent) {
                                deferred.resolve(mostRecent);
                            })
                            .catch(function (err) {
                                logger.error('get most recent details error')
                                logger.error(err);
                                deferred.reject(err); // job failed, will restart
                            })
                    })
                    .catch(function (err) {
                        logger.error(err);
                        deferred.reject(err); // job failed, will restart
                    })
            })
        return deferred.promise;
    },

    /**
     * Chunk the releases by type by iterating through and 
     * pushing releases to albums based on the pattern Spotify
     * uses to differentiate their releases. Albums are first,
     * followed by Singles, then EPs. Returns an array of Objects
     * with an ID value defining the release type.
     * @returns Array of Objects [[albums], [singles], [eps]]
     */
    getReleaseTypes: function (releases) {
        var processed = [];
        var chunks = [];
        // initialize 2d array
        for (i = 0; i < 3; i++) {
            chunks[i] = [];
        }
        var type;
        for (var i = 0; i < releases.length; i++) {
            if (releases[i].album_type === 'album' && type === 'single') {
                type = 'ep';
            } else if (releases[i].album_type === 'single') {
                type = 'single';
            } else {
                type = 'album';
            }

            releases[i].release_type = type;

            switch (type) {
                case 'album':
                    {
                        chunks[0].push(releases[i]);
                        break;
                    }
                case 'single':
                    {
                        chunks[1].push(releases[i]);
                        break;
                    }
                case 'ep':
                    {
                        chunks[2].push(releases[i]);
                        break;
                    }
            }
        }
        return chunks;
    },

    /**
     * When Spotify updates the details/music for an older release, that release gets
     * pushed to the top of the releases array. This causes an extremely rare bug where
     * date's of releases are incrementing instead of decrementing. We address this by 
     * keeping a running date variable to check to see if it is an increment or a decrement.
     * If it is a decrement, we know this is the current release for this array. 
     * @returns object with details of recent release
     */
    getMostRecentDetails: function (releases) {
        var self = this;
        var deferred = Q.defer(); // promise
        var recentRelease; // return value
        var releaseTypeIndex = 0; // array of arrays index
        var index = 0; // arrays index
        var date; // last date checked
        // var currDate = new Date();

        run(); // initialize
        function run() {
            // if we have releases to parse for this release type
            if (releases[releaseTypeIndex].length > 0) {
                self.getAlbumInfo(releases[releaseTypeIndex][index])
                    .then(function (album) {
                        if ((!recentRelease || recentRelease.release_date < album.release_date)) {
                            // if (album.release_date < currDate)
                            // todo:
                            // fix bug with releases being newer than current date
                            recentRelease = album;
                            index++; // move pointer right
                            if (index === releases[releaseTypeIndex].length) {
                                moveToNextArray();
                            }
                        } else {
                            moveToNextArray();
                        }

                        // if we still have an array to check && we still have elements inside of that array to check
                        if (releaseTypeIndex < 3 && index < releases[releaseTypeIndex].length) {
                            run();
                        } else {
                            if (recentRelease) {
                                deferred.resolve(recentRelease);
                            } else {
                                // give the api some time to return results for artists with small libraries
                                setTimeout(function () {
                                    deferred.resolve(recentRelease);
                                }, 1000);
                            }
                        }
                    })
                    .catch(function (err) {
                        logger.error(err);
                        deferred.reject(err);
                    })
            } else { // no releases of type
                moveToNextArray();
                if (releaseTypeIndex < releases.length) { // if there are release type arrays left
                    run();
                } else {
                    deferred.resolve(recentRelease); // no more releases found, return undefined
                }
            }

            function moveToNextArray() {
                releaseTypeIndex++;
                index = 0;
            }
        }
        return deferred.promise;
    },

    /**
     * Create an array of artist releases, limiting results to albums and singles.
     * @param artist
     * @returns {Q.Promise<T>}
     * @deprecated
     */
    getArtistReleases: function (artist) {
        var deferred = Q.defer(),
            offset = 0,
            limit = 50,
            releases = [];

        run();

        function run() {
            spotifyApi.getArtistAlbums(artist.spotify_id, ({
                    limit: limit,
                    offset: offset,
                    album_type: 'album,single'
                }))
                .then(function (data) {
                    releases = releases.concat(data.body.items);
                    offset += limit;
                    if (offset < data.body.total) {
                        run();
                    } else {
                        deferred.resolve(releases);
                    }
                })
                .catch(function (err) {
                    logger.error(err);
                    run();
                })
        }

        return deferred.promise;
    },

    getAlbumInfo: function (album) {
        var deferred = Q.defer();
        self.refreshClientToken()
            .then(function () {
                spotifyApi.getAlbum(album.id)
                    .then(function (data) {
                        var mAlbum = data.body;
                        mAlbum.release_type = album.release_type;
                        deferred.resolve(mAlbum);
                    })
                    .catch(function (err) {
                        deferred.reject('**GET ALBUM**' + err);
                    })
            })
            .catch(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    },

    /**
     * Returns an albums track array
     */
    getAlbumTracksItems: function (albumId, offset) {
        var deferred = Q.defer();
        this.getAlbumTracks(albumId, offset)
            .then(function (tracks) {
                deferred.resolve(tracks.items);
            })
            .catch(function (err) {
                deferred.reject(err);
            })
        return deferred.promise;
    },

    /**
     * Returns tracks and body information for the specified album
     * TODO: document & test
     */
    getAlbumTracks: function (albumId, offset) {
        var deferred = Q.defer();
        var limit = 50;

        if (!offset) {
            offset = 0;
        }

        self.refreshClientToken()
            .then(function () {
                spotifyApi.getAlbumTracks(albumId, {
                        limit: limit,
                        offset: offset
                    })
                    .then(function (data) {
                        deferred.resolve(data.body);
                    })
                    .catch(function (err) {
                        deferred.reject(err);
                    })
            })
            .catch(function (err) {
                deferred.reject(err);
            })
        return deferred.promise;
    },

    getRecentReleaseId: function (artist) {
        var deferred = Q.defer();
        self.refreshClientToken()
            .then(function () {
                spotifyApi.getArtistAlbums(artist.spotify_id, ({
                        limit: 1,
                        offset: 0
                    }))
                    .then(function (data) {
                        deferred.resolve(data.body.items[0].id);
                    })
                    .catch(function (err) {
                        deferred.reject('**GET ARTIST ALBUMS**' + err);
                    })
            })
            .catch(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    },

    getNewReleases: () => {
        logger.info('retrieving new releases from Spotify.');
        let cachedReleases = self.getCachedReleases();
        let twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);
        return new Promise((resolve, reject) => {
            if (cachedReleases.syncDate != undefined && Date.parse(cachedReleases.syncDate) > twentyFourHoursAgo)
                return resolve(cachedReleases.releases);
            logger.info('starting new release queries');
            return self.refreshClientToken()
                .then(() => self.getNewReleaseLen())
                .then((length) => {
                    console.log('new release length: ' + length);
                    if (length < 10000)
                        return self.queryNewReleases('tag:new');
                    return self.chunkAndQueryNewReleases();
                })
                .then((releases) => {
                    if (!process.env.NODE_ENV) {
                        cachedReleases.syncDate = new Date();
                        cachedReleases.releases = releases;
                        logger.info('writing cached releases to file...');
                        fs.writeFile(path.join(__dirname, './cache/cached-new-releases.txt'), JSON.stringify(cachedReleases, null, 4), {
                            encoding: 'utf-8',
                            flag: 'w'
                        }, function (err) {
                            if (err) {
                                logger.error('write file error thrown!');
                                logger.error(err, err.stack);
                            }
                        });
                    }
                    resolve(releases);
                })
                .catch((err) => {
                    logger.error(new Error(err));
                });
        });
    },

    getCachedReleases: () => {
        logger.info('getting cached releases');
        if (process.env.NODE_ENV) // dont use caching until we upgrade server mem
            return '{}';

        let p = path.join(__dirname, './cache/cached-new-releases.txt');
        let cachedReleases = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : '{}';
        
        if (cachedReleases) {
            cachedReleases = cachedReleases;
        }
        return cachedReleases;
    },

    /**
     * get length of tag:new query on spotify search
     */
    getNewReleaseLen: () => {
        return self.getSearchQueryLen('tag:new');
    },

    getSearchQueryLen: (query) => {
        return spotifyApi.searchAlbums(query, {
                limit: 1,
                offset: 0
            }).then((data) => {
                return data.body.albums.total;
            })
            .catch((err) => {
                logger.error('getSearchQe')
                logger.error(err);
                return -1;
            })
    },

    queryNewReleases: (query) => {
        logger.info('querying new releases for query: ' + query);
        return new Promise((resolve, reject) => {
            self.getSearchQueryLen(query)
                .then((length) => {
                    let offsets = [];
                    // grab as many as we can
                    for (let offset = 0; offset < length && offset <= 10000; offset += 50) {
                        offsets.push(offset);
                    }

                    Promise.map(offsets, (offset) => {
                        // logger.info('running query: ' + query + ' with offset: ' + offset);
                        
                        return Promise.delay(400).then(() => spotifyApi.searchAlbums(query, {
                                limit: 50,
                                offset: offset
                            })
                            .catch((err) => {
                                offset -= 50;
                                logger.error(new Error(err));
                            }));
                    }, {
                        concurrency: 5
                    }).then((releaseData) => {
                        logger.info('spotify queries resolved with length: ' + releaseData.length);
                        let releases = {};
                        for (let j in releaseData) {
                            if (!releaseData[j]) {
                                break;
                            }
                            try {
                                for (var i = 0; i < releaseData[j].body.albums.items.length; i++) {
                                    try {
                                        var album = {
                                            spotify_id: releaseData[j].body.albums.items[i].artists[0].id,
                                            name: releaseData[j].body.albums.items[i].artists[0].name,
                                            recent_release: {
                                                id: releaseData[j].body.albums.items[i].id,
                                                uri: releaseData[j].body.albums.items[i].uri,
                                                title: releaseData[j].body.albums.items[i].name,
                                                images: releaseData[j].body.albums.items[i].images,
                                                url: releaseData[j].body.albums.items[i].external_urls.spotify
                                            }
                                        };

                                        releases[album.spotify_id] ? releases[album.spotify_id].push(album) : releases[album.spotify_id] = [album];
                                    } catch (e) {
                                        logger.info('handled spotify corrupted object');
                                        logger.error(e.toString());
                                    }
                                }
                            } catch (e) {
                                logger.error(new Error(e));
                            }
                        }
                        logger.info('releases length ' + Object.keys(releases).length);
                        resolve(releases);
                    });
                });
        });

    },

    chunkAndQueryNewReleases: () => {
        logger.info('chunking new release queries');
        let newQuery = 'tag:new';
        return new Promise((resolve, reject) => {
            let promises = [];
            let digits = 0;
            let queries = self.buildAlphaQueryArr(digits);
            Promise.map(queries, (query) => {
                    return Promise.delay(0).then(() => self.execChunkNewReleaseQuery(query + ' ' + newQuery));
                }, {
                    concurrency: 1
                }).then(releasesArr => {
                    logger.info('completed retrieving new releases, building map' + releasesArr.length);
                    let releases = {};
                    try {
                        for (let i in releasesArr) {
                            logger.info(Object.keys(releasesArr[i]).length);
                            releases = { ...releases,
                                ...releasesArr[i]
                            };
                        }
                        logger.info('done');
                    } catch (e) {
                        logger.error(new Error(e));
                    } finally {
                        logger.info('total length: ' + Object.keys(releases).length);
                        resolve(releases);
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    execChunkNewReleaseQuery: (query) => {
        logger.info('executing chunked query');
        return new Promise((resolve, reject) => {
            self.getSearchQueryLen(query)
                .then((length) => {
                    logger.info('query length: length: ' + length);
                    return resolve(self.queryNewReleases(query));
                });
        })


    },

    execMultiDigitNewReleaseQuery: (query, digits) => {
        let queries = self.buildAlphaQueryArr(digits);
        let promises = [];
        for (let i in queries) {
            promises.push(self.queryNewReleases(queries[i]));
        }
        return new Promise((resolve, reject) => {
            Promise.map(promises, (x) => {
                    return Promise.delay(1000);
                }, {
                    concurrency: 2
                }).then((results) => {
                    let releases = [];
                    for (let i in results) {
                        releases = releases.concat(results[i]);
                    }
                    resolve(releases);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    buildMultiDigitAlphaQueryArr: (digits) => {

    },

    buildAlphaQueryArr: (digits) => {
        let alphUpper = 'ABCDEFGHIJKLMONPQRSTUVWXYZ';
        let alphLower = 'abcdefghijklmnopqrstuvwxyz';
        let length = alphUpper.length;
        let queries = [];
        for (let i = 0; i < length; i++) {
            queries = queries.concat(self.buildAlphaQueryMatrix(alphUpper[i], digits));
        }
        // queries.push(self.buildNewReleaseNotCase(queries));
        // queries.push(self.buildAlphaQueryMatrix('A', digits));
        return queries;
    },

    buildAlphaQueryMatrix: (character, digits) => {
        let alphUpper = 'ABCDEFGHIJKLMONPQRSTUVWXYZ0123456789';
        let alphLower = 'abcdefghijklmnopqrstuvwxyz';
        let length = alphUpper.length;
        let alphaCombinations = alphUpper.split('');

        if (digits == 0)
            return 'album:' + character + '*';

        // let matrix = alphaCombinations.map(x => {
        //     return 'album:' + x + '';
        // });

        for (let i = 0; i < digits; i++) {
            for (let j in alphaCombinations) {
                for (let i in alphLower) {
                    matrix.push('q=album:' + alphaCombinations[j] + alphLower[i] + '*');
                }
            }
        }
        return matrix;
    },

    /**
     * build a query that is not 
     */
    buildNewReleaseNotCase: (queries) => {
        logger.info(queries.length);
        let notStr = 'NOT album:';
        for (let i in queries) {
            try {
                let valArr = queries[i].split(':');
                notStr += valArr[1] + ' NOT album:';
            } catch (e) {
                logger.error(e, e.stack);
            }

        }
        notStr = notStr.slice(0, -11);
        return notStr;
    },

    /**
     * Gets all albums released in the last two weeks.
     * TODO:
     * 1. refactor to remove duplicate cache file creation
     */
    getNewReleasesOld: function () {
        logger.info('getting new releases');
        var runAttempts = 0;
        var deferred = Q.defer();
        var releases = {};
        var artistAdded = {};
        var query = 'tag:new';
        var checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - 1); // 24 hours
        var p = path.join(__dirname, './cache/cached-new-releases.txt');
        var cachedReleases = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : undefined;
        if (cachedReleases) {
            cachedReleases = JSON.parse(cachedReleases);
        } else {
            cachedReleases = {};
        }

        // if syncDate has not been set or syncDate is older than 24 hours from this point
        if (cachedReleases.syncDate === undefined || Date.parse(cachedReleases.syncDate) < checkDate) {
            cachedReleases.syncDate = new Date();
            self.refreshClientToken()
                .then(function () {
                    run();
                    var offset = 0;

                    function run() {
                        logger.debug(offset);
                        logger.debug(query);
                        spotifyApi.searchAlbums(query, {
                                limit: 50,
                                offset: offset
                            })
                            .then(function (data) {

                                logger.debug(data.statusCode);


                                for (var i = 0; i < data.body.albums.items.length; i++) {
                                    try {
                                        var album = {
                                            spotify_id: data.body.albums.items[i].artists[0].id,
                                            name: data.body.albums.items[i].artists[0].name,
                                            recent_release: {
                                                id: data.body.albums.items[i].id,
                                                uri: data.body.albums.items[i].uri,
                                                title: data.body.albums.items[i].name,
                                                images: data.body.albums.items[i].images,
                                                url: data.body.albums.items[i].external_urls.spotify
                                            }
                                        };

                                        releases[album.spotify_id] ? releases[album.spotify_id].push(album) : releases[album.spotify_id] = [album];
                                    } catch (e) {
                                        logger.info('handled spotify corrupted object');
                                        logger.error(e, e.stack);
                                    }
                                    // releases.push(album);
                                    // if (!artistAdded[album.name]){
                                    //     artistAdded[album.name] = true;
                                    //     releases.push(album);
                                    // }
                                }
                                offset = offset + 50;
                                if (offset < data.body.albums.total) {
                                    logger.info('new release progress: ' + offset + '/' + data.body.albums.total);
                                    run();
                                } else {
                                    logger.info('Last two weeks of releases from Spotify grabbed!');
                                    cachedReleases.releases = releases;
                                    if (!process.env.NODE_ENV) {
                                        logger.info('writing cached releases to file...');
                                        
                                        if (!fs.existsSync(path.join(__dirname, './cache'))) 
                                            fs.mkdirSync(path.join(__dirname, './cache'));
                                        
                                            fs.writeFile(path.join(__dirname, './cache/cached-new-releases.txt'), JSON.stringify(cachedReleases, null, 4), {
                                            encoding: 'utf-8',
                                            flag: 'w'
                                        }, function (err) {
                                            if (err) {
                                                logger.error('> write file error thrown!');
                                                logger.error(err, err.stack);
                                            }
                                        });
                                    }
                                    deferred.resolve(releases);
                                }
                            })
                            .catch(function (err) {
                                logger.error(err, err.stack);
                                if (runAttempts < 50000) {
                                    logger.debug('Run attempt: ' + runAttempts);
                                    runAttempts++;
                                    offset++; // eventually we will get past bad one
                                    run();
                                }
                            })
                    }
                })
                .catch(function (err) {
                    logger.error(err);
                });
        } else {
            deferred.resolve(cachedReleases.releases);
        }

        return deferred.promise;
    },

    // USED FOR TESTING PURPOSES ONLY
    // DUPLICATE CODE DUE TO MAINTAINING PROD METHOD READABILITY
    getSecondRecentRelease: function (artist) {
        var deferred = Q.defer();
        // ensure fresh token
        self.refreshClientToken()
            .then(function () {
                // retrieve most recent release
                spotifyApi.getArtistAlbums(artist.spotify_id, ({
                        limit: 9,
                        offset: 0
                    }))
                    .then(function (data) {
                        var i = 0;
                        // skip generic artists like 'various artists' who don't have any album releases
                        if (data.body.items.length > 0) {
                            // skip international releases to find next new album
                            while (data.body.items[0].name === data.body.items[i].name) {
                                if (i < data.body.items.length - 1) {
                                    i++;
                                } else {
                                    break;
                                }
                            }
                            self.getAlbumInfo(data.body.items[i])
                                .then(function (data) {
                                    deferred.resolve(data);
                                })
                                .catch(function (err) {
                                    deferred.reject('**GET ALBUM INFO**' + err);
                                })
                        } else {
                            deferred.resolve();
                        }
                    })
                    .catch(function (err) {
                        deferred.reject(err);
                    })
            })
            .catch(function (err) {
                logger.error(err);
                deferred.reject('**REFRESH CLIENT TOKEN**' + err);
            });
        return deferred.promise;
    }
};