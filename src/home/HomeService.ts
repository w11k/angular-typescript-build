import {appModule} from "../app";
import {Subject} from "rxjs/Subject";

export class HomeService {

    private counter = 1;

    constructor() {
        const s = new Subject<number>();
        s.subscribe(value => {
            console.log("got:" + value);
        });
        s.next(1);
    }

    getAndIncrement() {
        return this.counter++;
    }

}

appModule.service("homeService", HomeService);
