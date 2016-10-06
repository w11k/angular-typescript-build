import {appModule} from "../app";

export class HomeService {

    private counter = 1;

    getAndIncrement() {
        let x = [1, 2, 3];

        const l = _.filter(x, i => {
            return i > 1;
        });
        console.log(l);
        console.log(l);
        console.log(l);
        console.log(l);

        return this.counter++;
    }

}

appModule.service("homeService", HomeService);


// TEST
const hs = new HomeService();
console.log(hs.getAndIncrement());
