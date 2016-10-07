import {HomeService} from "./HomeService";
import {appModule} from "../appModule";

class HomeController {

    clicks = 0;
    // legacyMessage: string;

    constructor(private homeService: HomeService/*, legacyService: any*/) {
        "ngInject";
        // this.legacyMessage = legacyService.getMessage();
    }

    click() {
        this.clicks = this.homeService.getAndIncrement();
    }

}

appModule.controller("HomeController", HomeController);
