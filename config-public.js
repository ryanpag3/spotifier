var config = {};
    config.spotify = {};

config.url = 'http://localhost:3000';
config.prodUrl = 'https://spotifier.io';
config.confirmCodeLength = 16;
config.placeholderAlbumTitle = 'fetching artist details...';
config.spotify.playlistTitle = 'spotifier.io | New Releases | Week of ' + getMonday();
config.spotify.playlistDescription = 'This is a BETA feature. There may be bugs. Please report any to github.com/ryanpage42/spotifier. If you would like to turn off playlists, you may do so at https://spotifier.io/settings';

// TODO: refactor to use this config variable. 
// turn on for more verbose debugging output
config.verboseMode = true;

config.log = {
    fileLevel: 'debug',
    consoleLevel: 'debug',
    timestampPattern: 'YYYY-MM-DD HH:mm:ss',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '' // never delete
}
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
    return new Date(d.setDate(diff)).toLocaleDateString("en-US");
}