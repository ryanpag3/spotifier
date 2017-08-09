var app = angular.module('spotifier');

app.controller('email-controller', ['$scope', function($scope) {
    // todo

    /**
     *
     */
    $scope.submitEmail = function() {
        // if inputs are not matching
        if ($scope.email === $scope.confirmEmail) {
            $scope.matching = true;
            // success
        } else {
            $scope.matching = false;
        }
    };

    /** HELPER METHODS **/
    /**
     * Validates two inputs to check for equality
     * @param input1
     * @param input2
     * @returns {Boolean}
     */
    function inputsMatch(input1, input2){
        if (input1 === input2) {
            $scope.matching = true;
            return true;
        } else {
            $scope.matching = false;
            return false;
        }
    }

}]);