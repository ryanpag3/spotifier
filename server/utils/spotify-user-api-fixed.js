var SpotifyApi = require('spotify-web-api-node'),
    Q = require('q'),
    Db = require('../utils/db-wrapper.js'),
    credentials = {
        clientId: '180cc653f1f24ae9864d5d718d68f3c6',
        clientSecret: '7e3b3a161dc6442f974655a3209505cd'
    };

// constructor
function Api() {
     this.spotifyApi = new SpotifyApi(credentials);
     this.artists = [];
     this.artistAdded = {};
     this.offset = 0;
     this.total = 0;
     this.searchResults = [];
}

/** METHODS **/

Api.prototype.syncLibrary = function(user) {
    var api = this,
        deferred = Q.defer();

    api.setAccessToken(user)
         .then(function() {
              api.getLibraryArtists(user)
                  .then(function(artists) {
                      var db = new Db();
                      console.log(user.name + '\'s library is being added.');
                      // for (var i = 0; i < artists.length; i++){
                      //     console.log(artists[i].name);
                      // }
                      db.addAllArtists(user, artists);
                      deferred.resolve();
              })
                  .catch(function(err) {
                      console.log(err);
                      deferred.reject(err);
                  })
      })
        .catch(function(err) {
            console.log(err);
            deferred.reject(err);
        });
    return deferred.promise;
};

/**
 * The authentication strategy does not handle expiration times for tokens automatically, so we check and see if
 * we have already set an expiration date in milliseconds, or if the expiration time has passed. If the token is
 * still valid, we do not need to call Spotify's api for a new one.
 * @param user
 */
Api.prototype.getAccessToken = function (user) {
    var api = this.spotifyApi,
        deferred = Q.defer(),
        currentDate = new Date().getTime(); // in millis
    // if we havent set the expireDate or if the currentDate is past the expireDate
    if (user.accessToken.expireDate === undefined || user.accessToken.expireDate < currentDate) {
        console.log('creating new token...');
        api.setRefreshToken(user.refreshToken);
        // refresh token
        api.refreshAccessToken()
            .then(function (data) {
                // assign access token
                // api.setAccessToken(data.body.access_token);
                // return new token
                deferred.resolve({
                    token: data.body.access_token,
                    expireDate: currentDate + (data.body.expires_in * 1000) - 60000
                });
            })
            .catch(function (err) {
                deferred.reject(err);
            })
    } else {
        // token doesn't need to be refreshed, return
        deferred.resolve();
    }
    return deferred.promise;
};

Api.prototype.setAccessToken = function (user) {
    var deferred = Q.defer();
    if (user) {
        this.spotifyApi.setAccessToken(user.accessToken.token);
        deferred.resolve();
    } else {
        deferred.reject('user does not exist.');
    }
    return deferred.promise;
};

/**
 * Requests user's saved tracks in blocks of 50, iterates through and saves each new artist it runs into. Repeats until
 * all of the user's saved tracks have been processed.
 * @param user
 */
Api.prototype.getLibraryArtists = function (user) {
    var self = this;
    const api = this.spotifyApi;
    const limit = 50;
    var offset = 0,
        deferred = Q.defer();


    // initializer
    function go() {
        self.setAccessToken(user)
            .then(function() {
                api.getMySavedTracks({
                    limit: limit,
                    offset: offset
                })
                    .then(function (data) {
                        // iterate through the 50 tracks that are returned
                        for (var i = 0; i < data.body.items.length; i++) {
                            var track = data.body.items[i].track;
                            // grab primary artist id and ignore features
                            var artistId = track.artists[0].id;
                            // if we havent added the artist already and the artist currently is active on spotify
                            if (self.artistAdded[artistId] === undefined && track.available_markets.length > 0) {
                                var name = track.artists[0].name;
                                self.artistAdded[artistId] = true; // flag artist added
                                self.artists.push({spotifyId: artistId, name: name}); // push artist to array
                            }
                        }
                        // adjust offset to either 50 ahead or to the end of the track list
                        offset += ((data.body.total - offset < limit) ? data.body.total - offset : limit);
                        // if offset is behind the end of the track list
                        if (offset < data.body.total - 1) {
                            setTimeout(go, 0); // run again
                        } else {
                            console.log('artists successfully grabbed with a length of: ' + self.artists.length);
                            deferred.resolve(self.artists); // return array
                        }
                    })
                    // catch getMySavedTracks errors
                    .catch(function (err) {
                        console.log(err);
                        deferred.reject(err); // return error message
                    });
            })
            .catch(function(err) {
                console.log(err);
            });
    }
    // begin recursive call
    go();
    return deferred.promise;
};

/**
 * queries the spotify api for an artist and returns the results
 * @param user
 * @param query
 */
Api.prototype.searchArtists = function (user, query) {
    const limit = 5;
    var deferred = Q.defer(),
        api = this.spotifyApi,
        offset = 0,
        query = query.trim() + '*';

    this.setAccessToken(user)
        .then(function() {
            api.searchArtists(query, ({
                limit: limit,
                offset: offset,
                from_token: user.accessToken.token
            }))
                .then(function(res) {
                    var results = [];
                    for (var i = 0; i < res.body.artists.items.length; i++) {
                        var artist = res.body.artists.items[i];
                        var url =
                            res.body.artists.items[i].images.length > 0
                                ? res.body.artists.items[i].images[res.body.artists.items[i].images.length - 1].url
                                : '';

                        results.push({
                            name: artist.name,
                            spotifyId: artist.id,
                            url: url
                        })
                    }
                    deferred.resolve(results);
                })
                .catch(function(err) {
                    console.log(err);
                    deferred.reject(err);
                })
        });
    return deferred.promise;
};

module.exports = Api;

