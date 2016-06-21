import {appModule} from "../app";
import {Subject} from "rxjs/Subject";

export class HomeService {

    private counter = 1;

    getAndIncrement() {
        const s = new Subject<number>();
        s.next(1);

        // let x = parseInt("12");
        return this.counter++;
    }

}

appModule.service("homeService", HomeService);
