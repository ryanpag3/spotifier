var app = angular.module('spotifier');
app.factory('apiService', ['$q', '$http', 'Spotify',
    function($q, $http, Spotify) {
        return ({
            setAuthToken: setAuthToken,
            syncLibrary: syncLibrary
        });

        function setAuthToken(authToken) {
            Spotify.setAuthToken(authToken);
            console.log('access token has been set.');
        }

        /*
            Iterates through the user's saved tracks. If the artist does not exist in the
            table, it gets the most recent release from them, and then detailed album release
            information and pushes the object.
            @returns an array of all unique artists in the user library
            // TODO: DISABLE UI ELEMENT AND SHOW LOADING BAR DURING FUNCTION RUN
         */
        function syncLibrary() {
            // set default values
            var limit = 50,
                offset = 0,
                ITERATION_SPEED_IN_MILLIS = 30,
                savedArtists = {};
            // start
            processTrackBlock(limit, offset, function() {
                console.log('processing finished, sending data to server');
                // callback run once end of tracklist found
                // post savedArtists to server
                $http.post('/library/sync', {
                    savedArtists: savedArtists
                })
                    .then(function(res){

                    })
                    .catch(function(err){

                    })
            });

            /**
             * used for recursively processing user tracks in chunks
             * @param limit: chunk size, max = 50
             * @param offset: initial position, most recent song added is position zero
             */
            function processTrackBlock(limit, offset, callback) {
                Spotify.getSavedUserTracks({
                    limit: limit,
                    offset: offset
                })
                    .then(function (res) {
                        console.log('processed ' + offset + ' of ' + res.data.total);
                        // initializer with callback
                        function go(callback) {
                            var i = 0; // index value of track block
                            function processTrack() {
                                var artistId = res.data.items[i].track.artists[0].id;
                                // if artist release information has not been retrieved
                                if (savedArtists[artistId] === undefined) {
                                    // get recent release
                                    Spotify.getArtistAlbums(artistId, ({
                                        limit: 1,
                                        offset: 0
                                    }))
                                        .then(function (res) {
                                            var albumId = res.data.items[0].id;
                                            // get detailed album information
                                            Spotify.getAlbum(albumId)
                                                .then(function (res) {
                                                    var recentRelease = res.data;
                                                    savedArtists[recentRelease.artists[0].id] = {
                                                        name: recentRelease.artists[0].name,
                                                        recentRelease: {
                                                            name: recentRelease.name,
                                                            date: recentRelease.release_date,
                                                            images: recentRelease.images,
                                                            url: recentRelease.external_urls.spotify
                                                        }
                                                    }
                                                })
                                                .catch(function(err) {
                                                    console.log('GET ALBUM ERROR');
                                                    console.log(err);
                                                })
                                        })
                                        .catch(function(err){
                                            console.log('GET ARTIST ALBUMS ERROR');
                                            console.log(err);
                                        })
                                }
                                // run callback if end of trackblock reached
                                if (++i < res.data.items.length) {
                                    setTimeout(processTrack, ITERATION_SPEED_IN_MILLIS);
                                } else {
                                    callback();
                                }
                            }

                            processTrack();
                        }

                        go(function () {
                            // offset is the starting position of the iteration
                            // limit is how many tracks to get
                            // we move offset by 50 each iteration,
                            // move offset
                            offset += ((res.data.total - offset < limit) ? res.data.total - offset : limit);
                            if (offset < res.data.total - 1) { // adjust for zero-based
                                processTrackBlock(limit, offset, callback);
                            } else {
                                callback();
                            }
                        })
                    })
                    .catch(function(err){
                        console.log('GET SAVED USER TRACKS ERROR');
                        console.log(err);
                    })
            }
        }
    }]);