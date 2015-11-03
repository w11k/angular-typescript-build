import {appModule} from "./app";

appModule.config(($stateProvider: any, $urlRouterProvider: any) => {
    "ngInject";

    $urlRouterProvider.otherwise("/home");

    $stateProvider.state("home", {url: "/home", templateUrl: "home/home.html"});

});

