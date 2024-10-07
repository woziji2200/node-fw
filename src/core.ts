import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import "reflect-metadata"

declare interface ParamType {
    name: string,
    type?: any,
    required?: boolean,
    defaultValue?: any,
    checkFunction?: Function
}
interface ParamWithIndexType extends ParamType {
    index: number
}
declare interface BodyType extends ParamType {

}
declare interface BodyWithIndexType extends BodyType {
    index: number
}
declare interface RoutesType {
    method: string,
    handler: Function,
    routePath: url.URL | string,
    params?: ParamWithIndexType[],
    bodys?: BodyWithIndexType[]
}

export default class fw {

    private _app: http.Server | undefined;
    private _routes: RoutesType[] = [];

    constructor() {
        if (typeof process === 'undefined') {
            throw new Error('This framework can only be run in Node.js');
        }
    }

    registerRouter(routerDir: string) {
        function requireFiles(dir: string) {
            fs.readdirSync(dir).forEach(file => {
                let filePath = path.join(dir, file);
                if (fs.statSync(filePath).isDirectory()) {
                    requireFiles(filePath);
                } else {
                    if (path.extname(filePath).toLowerCase() === '.js' || path.extname(filePath).toLowerCase() === '.ts') {
                        require(filePath);
                    }
                }
            });
        }
        requireFiles(routerDir);
    }

    listen(port: number, callback: () => void) {

        // console.dir(this._routes, {depth: null});
        this._app = http.createServer((req, res) => {

        });
        this._app.listen(port, callback);
    }

    RestfulApi<T>(routePath: string = "") {
        return (controller: new (...args: any[]) => T) => {
            const prototype = controller.prototype;
            const propertyNames = Object.getOwnPropertyNames(prototype);
            for (const propertyName of propertyNames) {
                const property = prototype[propertyName];
                const method = Reflect.getMetadata('__method', property);
                if (propertyName !== 'constructor' && typeof property === 'function' && method) {
                    this._routes.push({
                        routePath: routePath + Reflect.getMetadata('__routePath', property),
                        handler: property,
                        method: method,
                        params: Reflect.getMetadata('__params', property) || [],
                        bodys: Reflect.getMetadata('__bodys', property) || []
                    });
                }
            }
        }
    }

    param<T>(param: ParamType) {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            param.required = param.required || true;
            const api = (target as any)[propertyKey];
            let params = Reflect.getMetadata('__params', api) || [];
            params.push({ ...param, index: parameterIndex });
            Reflect.defineMetadata('__params', params, api);
        }
    }

    body<T>(body: BodyType) {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            body.required = body.required || true;
            const api = (target as any)[propertyKey];
            let bodys = Reflect.getMetadata('__bodys', api) || [];
            bodys.push({ ...body, index: parameterIndex });
            Reflect.defineMetadata('__bodys', bodys, api);
        }
    }


    get<T>(routePath: string = "") {
        return function (target: T, propertyKey: string, descriptor: PropertyDescriptor) {
            Reflect.defineMetadata('__routePath', routePath, descriptor.value);
            Reflect.defineMetadata('__method', 'GET', descriptor.value);
        }
    }


    post(routePath: string) {

    }
}