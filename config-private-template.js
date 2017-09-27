/**
 * This is a template for allowing contributors to get started quickly running the project. Simply create a directory
 * in the root project folder called /private/ and copy this file in there. Then, rename it to config-private.js and
 * add the respective values you need.
 * @type {{}}
 */
var config = {};

config.gmail = {};
config.spotify = {};

/**
 * gmail account credentials are used for sending test emails
 * You will need to go to account->Connected apps & sites and scroll
 * down to the bottom and turn Allow less secure apps: ON
 * -----------------------------------------------------------------------------
 * It is HIGHLY recommended you create a dummy gmail account only for testing. |
 * -----------------------------------------------------------------------------
 */
config.gmail.username = 'YOUR EMAIL HERE';
config.gmail.password = 'YOUR EMAIL PASSWORD';

/**
 * These are the api tokens used for authenticating the application. 
 * Create your own here: https://developer.spotify.com/my-applications/#!/applications
 */
config.spotify.clientId = 'YOUR CLIENT ID';
config.spotify.clientSecret = 'YOUR CLIENT SECRET';

module.exports = config;