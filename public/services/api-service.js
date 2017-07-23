var app = angular.module('spotifier');
app.factory('apiService', ['$q', '$http', function($q, $http) {
    return ({
        search: search
    });


    function search(artistName) {
       var deferred = $q.defer();
       $http.post('/library/search', {artistName: artistName})
           .then(function(res) {
              // todo: handle success
               deferred.resolve();
           })
           .catch(function(err) {
               // todo: handle failure
               deferred.reject();
           });

       return deferred.promise;
    }
}]);