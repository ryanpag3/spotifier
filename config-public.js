var config = {};
    config.spotify = {};

config.url = 'http://localhost:3000';
config.prodUrl = 'https://spotifier.io';
config.confirmCodeLength = 16;
config.placeholderAlbumTitle = 'details request queued...';
config.spotify.playlistTitle = 'spotifier.io | New Releases | Week of ' + getMonday();
config.spotify.playlistDescription = 'Testing!';


module.exports = config;


/**
 * Solution found @ 
 * https://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
 * TODO:
 * add date formatting
 **/
function getMonday() {
    var d = new Date(new Date());
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}