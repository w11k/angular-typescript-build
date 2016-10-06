angular.module("app").service("legacyService", function () {

    this.getMessage = function () {
        return "Message from LegacyService";
    }

});
