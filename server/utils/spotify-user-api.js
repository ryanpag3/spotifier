var SpotifyApi = require('spotify-web-api-node'),
    Q = require('q'),
    credentials = {
        clientId: '180cc653f1f24ae9864d5d718d68f3c6',
        clientSecret: '7e3b3a161dc6442f974655a3209505cd'
    };


var self = module.exports = {
    /** grab all unique artists that a user has on their saved songs **/
    getLibraryArtists: function(user) {
        var spotifyApi = new SpotifyApi(credentials),
            limit = 50,
            offset = 0,
            artists = [],
            artistAdded = {},
            deferred = Q.defer();
        spotifyApi.setAccessToken(user.accessToken);

        console.log('grabbing artists for ' + user.id);
        function go() {
            spotifyApi.getMySavedTracks({
                limit: limit,
                offset: offset
            })
                .then(function(data) {
                    for (var i = 0; i < data.body.items.length; i++) {
                        var track = data.body.items[i].track;
                        // grab primary artist id, ignore features
                        var artistId = track.artists[0].id;
                        if (artistAdded[artistId] === undefined && track.preview_url !== null) {
                            var artistName = track.artists[0].name;
                            artistAdded[artistId] = true;
                            artists.push({artistId: artistId, artistName: artistName});
                        }
                    }
                    offset += ((data.body.total - offset < limit) ? data.body.total - offset : limit);
                    if (offset < data.body.total - 1) {
                        go();
                    } else {
                        console.log('artists successfully grabbed...');
                        deferred.resolve(artists);
                    }
                })
                .catch(function(err) {
                    console.log(offset);
                    console.log(err);
                    deferred.reject();
                });
        };

        go(limit, offset);

        return deferred.promise;
   }
};