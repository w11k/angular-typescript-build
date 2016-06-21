import {appModule} from "../app";

export class HomeService {

    private counter = 1;

    getAndIncrement() {
        // let x = parseInt("12");
        return this.counter++;
    }

}

appModule.service("homeService", HomeService);
