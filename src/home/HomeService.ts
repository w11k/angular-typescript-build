import {appModule} from "../app";
import * as _ from "lodash";

export class HomeService {

    private counter = 1;

    getAndIncrement() {


        let x = [1, 2, 3];
        const l = _.filter(x, i => {
            return i > 1;
        });
        console.log(l);




        return this.counter++;
    }

}

appModule.service("homeService", HomeService);
