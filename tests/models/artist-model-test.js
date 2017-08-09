var expect = require('chai').expect;
var Artist = require('../../server/models/artist');
describe('Artist Model Validation', function() {
    it('should be invalid if name is empty', function(done) {
        var artist = new Artist();
        artist.validate(function(err) {
            expect(err.errors.name).to.exist;
            done();
        })
    });
    it('should be invalid if spotify_id is empty', function(done) {
        var artist = new Artist();
        artist.validate(function(err) {
            expect(err.errors.spotify_id).to.exist;
            done();
        })
    });
    it('should be invalid if recent_release title is empty', function(done) {
       var artist = new Artist();
       artist.validate(function(err) {
           expect(err.errors.recent_release).to.exist;
           done();
       })
    });
});