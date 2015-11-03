import {appModule} from "../app";

export class HomeService {

    private counter = 1;

    getAndIncrement() {
        return this.counter++;
    }

}

appModule.service("homeService", HomeService);
