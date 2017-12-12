/**
 * Script for running all unit tests
 */

 describe('Run all unit tests', function() {
    describe('test-helpers-test.js', function() {
        require('./test-helpers-test');
    })

    describe('utils/db-wrapper-test.js', function() {
        require('./utils/db-wrapper-test');
    })

    describe('utils/email-handler-tests.js', function() {
        require('./utils/email-handler-tests');
    })

    describe('utils/logger-test.js', function() {
        require('./utils/logger-test');
    })

    describe('utils/new-release-scanner-test.js', function() {
        require('./utils/new-release-scanner-test');
    })

    describe('utils/playlist-handler-tests.js', function() {
        require('./utils/playlist-handler-tests');
    })

    describe('utils/queue-get-artist-details-tests.js', function() {
        require('./utils/queue-get-artist-details-tests');
    })

    describe('utils/queue-sync-user-library-tests.js', function() {
        require('./utils/queue-sync-user-library-tests');
    })

    describe('utils/spotify-server-api-test.js', function() {
        require('./utils/spotify-server-api-test');
    })

    describe('utils/spotify-user-api-tests.js', function() {
        require('./utils/spotify-user-api-tests');
    })

    describe('utils/artist-model-test.js', function() {
        require('./models/artist-model-test');
    })

    describe('utils/user-model-test.js', function() {
        require('./models/user-model-test');
    })
 })