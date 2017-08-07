var app = angular.module('spotifier');
app.directive('artistToggle', function() {
    return {
        restrict: 'EA',
        templateUrl: 'templates/artist-toggle-template.html'
    }
});