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
 * This is necessary for running unit tests for the playlist-handler.
 * The current way of creating a refresh token for testing is rather
 * hacky, and I have plans in the pipeline to create a simple
 * webserver tool that will generate your testing refresh token 
 * automatically. The easiest way to create your testing refresh token
 * right now is the following:
 * 1. create a sample spotify account, doesnt matter if free or premium
 * 2. spin up local server instance
 * 3. login using test account
 * 4. open mongo.exe or equivalent mongo cli
 * 5. query for your test account by running the following commands
 *      - use spotifier
 *      - db.users.find({'name': 'YOUR SPOTIFY ACCOUNT NAME'}, {refresh_token: 1})
 *      - OR if you log in using facebook and spotify created an account name for you
 *      - db.users.find({'email.address': 'EMAIL ADDRESS YOU SIGNED UP WITH'}, {refresh_token: 1})
 */
config.spotify.testRefreshToken = 'REFRESH TOKEN HERE';

/**
 * These are the api tokens used for authenticating the application. 
 * Create your own here: https://developer.spotify.com/my-applications/#!/applications
 */
config.spotify.clientId = 'YOUR CLIENT ID';
config.spotify.clientSecret = 'YOUR CLIENT SECRET';

module.exports = config;