import { appModule } from "../app";

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

let abcdef = 123456789;
console.log(abcdef);
appModule.service("homeService", HomeService);


// TEST
console.log(HomeService);
