import { app } from './test';

@app.RestfulApi()
export class controller2 {
    @app.get('/get')
    index(id: number) {
        console.log(11111222);
        return 'get';
    }
}


@app.RestfulApi('/api')
export class controller3 {
    constructor() {
        console.log('controller3');
    }

    @app.get('/asdsd')
    index(
        @app.param({ name: 'aaa' }) qwq: string,
        @app.body({ name: 'id' }) id: number,
        @app.body({ name: 'i1d' }) id2: number
    ) {
        console.log(11111222);
    }

    qwq(id: number) {
    }
}