import {appModule} from "../app";
import {HomeService} from "./HomeService";

class HomeController {

    clicks = 0;

    constructor(private homeService: HomeService) {
        "ngInject";
    }

    click() {
        this.clicks = this.homeService.getAndIncrement();
    }

}

appModule.controller("HomeController", HomeController);
