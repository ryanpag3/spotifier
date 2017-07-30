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
            // // set default values
            // var savedArtists = {};
            //
            //
            // getArtistIds();
            //
            // /**
            //  * Get's all artist ID's of each unique artist in a user library
            //  */
            // function getArtistIds() {
            //     var limit = 50,
            //         offset = 0,
            //         artistArray = [];
            //     // start
            //     go(limit, offset);
            //     console.log('getting unique artists...');
            //     function go(limit, offset) {
            //         Spotify.getSavedUserTracks({
            //             limit: limit,
            //             offset: offset
            //         })
            //             .then(function(res) {
            //                 for (var i = 0; i < res.data.items.length; i++) {
            //                     var artistId = res.data.items[i].track.artists[0].id;
            //                     if (savedArtists[artistId] === undefined && res.data.items[i].track.preview_url !== null) {
            //                         var artistName = res.data.items[i].track.artists[0].name;
            //                         savedArtists[artistId] = {artistId: artistId, artistName: artistName};
            //                         artistArray.push({artistId: artistId, artistName: artistName});
            //                     }
            //                 }
            //                 offset += ((res.data.total - offset < limit) ? res.data.total - offset : limit);
            //                 if (offset < res.data.total - 1) {
            //                     setTimeout(go(limit, offset += limit), 500);
            //                 } else {
            //                     console.log('sending artists to server...');
            //                     $http.post('/library/sync', {
            //                         artists: artistArray
            //                     })
            //                         .then(function(res) {
            //                             console.log(res);
            //                         })
            //                 }
            //             })
            //     }
            }

            // deprecated: causes 429 errors when run across multiple clients, cannot sustain production
            // level users.

            // /**
            //  * Get the most recent release of all the artists, add the albumId to the savedArtist objects
            //  */
            // function getRecentReleasesIds() {
            //     console.log('getting recent release info...');
            //     var i = 0,
            //         INTERVAL = 50,
            //         artistIds = [];
            //     // create array of artist ids for slow iteration by index
            //     Object.keys(savedArtists).forEach(
            //         function(key, index) {
            //             artistIds.push(savedArtists[key].artistId);
            //         }
            //     );
            //
            //     // start
            //     getRelease();
            //
            //     function getRelease() {
            //         Spotify.getArtistAlbums(artistIds[i], ({
            //             limit: 1,
            //             offset: 0
            //         }))
            //             .then(function(res) {
            //                 savedArtists[artistIds[i]].recentRelease = {albumId: res.data.items[0].id};
            //                 i++;
            //                 if (i < artistIds.length){
            //                     setTimeout(getRelease, INTERVAL);
            //                 } else {
            //                     getRecentAlbumInfo();
            //                 }
            //             })
            //             .catch(function(err) {
            //                 console.log(err);
            //             });
            //     }
            // }
            //
            // /**
            //  * get release date and album artwork for all recent releases by artist
            //  * and add to the savedArtist object
            //  */
            // function getRecentAlbumInfo() {
            //     console.log('getting detailed album info...');
            //     var albumBlocks = [],
            //         block = [];
            //
            //     Object.keys(savedArtists).forEach(
            //         function(key, index) {
            //             index = index+1;
            //             block.push(savedArtists[key].recentRelease.albumId);
            //             if (index % 20 === 0) {
            //                 albumBlocks.push(block);
            //                 block = []; // empty array
            //             } else if (index === Object.keys(savedArtists).length) {
            //                 albumBlocks.push(block);
            //                 block = []; // empty, optional
            //             }
            //         }
            //     );
            //
            //     var j = 0, // album block iterator
            //         i = 0; // savedArtists iterator
            //     getAlbums(j, i);
            //     function getAlbums(j, i) {
            //         console.log('j = ' + j);
            //         console.log('i = ' + i);
            //
            //         Spotify.getAlbums(albumBlocks[j])
            //             .then(function(res) {
            //                 console.log(res.data);
            //                 if (j++ < albumBlocks.length-1){
            //                     getAlbums(j, i);
            //                 } else {
            //                     alert('DONE');
            //                 }
            //
            //             })
            //     }
            // }
    }]);