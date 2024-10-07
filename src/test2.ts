import { app } from './test';

@app.RestfulApi
export class controller2 {
    @app.Get('/get')
    index(@app.required id: number) {
        console.log(11111222);
    }
}

function test(...args: any[]) {
    console.log(args);
}

@app.RestfulApi('/api')
export class controller3 {
    
    @app.Get
    index(qwq: string, @test id: number) {
        console.log(11111222);
    }

    qwq() {

    }
}