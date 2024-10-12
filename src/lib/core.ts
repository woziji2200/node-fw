import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import "reflect-metadata"

declare interface ParamType {
    name: string,
    required?: boolean,
    defaultValue?: any,
    checkFunction?: (value: any) => boolean
}
interface ParamWithIndexType extends ParamType {
    index: number
}
declare interface BodyType extends ParamType {

}
declare interface BodyWithIndexType extends BodyType {
    index: number
}
declare interface UrlParamType {
    name: string,
    checkFunction?: (value: any) => boolean
}
declare interface UrlParamWithIndexType extends UrlParamType {
    index: number
}
declare interface OptionsSetterWithIndexType {
    index: number,
}
export declare interface Request extends http.IncomingMessage { }
export declare interface Response extends http.ServerResponse { }
interface RequestWithIndexType {
    index: number
}
interface ResponseWithIndexType {
    index: number
}
export declare interface RoutesType {
    method: string,
    handler: (...args: any[]) => HandlerResponse | Promise<HandlerResponse>,
    routePath: string | RegExp,
    params?: ParamWithIndexType[],
    bodys?: BodyWithIndexType[],
    optionsSetter?: OptionsSetterWithIndexType[],
    req?: RequestWithIndexType[],
    res?: ResponseWithIndexType[]
    
}
export declare interface HandlerResponse {
    data: any,
    options?: {
        headers?: { [key: string]: string },
        statusCode?: number
    }
}

export declare type ErrorMiddleWire = (err: Error, res: Request, req: Response) => void | Promise<void>
export declare type MiddleWire = (res: Request, req: Response) => void | Promise<void>
type MiddleWireArray = { routePath: string | RegExp, middleWire: ErrorMiddleWire | MiddleWire }[]
function tryToJSON(data: any) {
    const jsonReg = /^(\{|\[).*(\}|\])$/;
    try {
        if (jsonReg.test(data)) {
            return JSON.parse(data);
        }
    } catch (e) {
        return data;
    }
}
function tryToString(data: any, res?: Response) {
    if (typeof data === 'string') {
        if (res) {
            res.setHeader('Content-Type', 'text/plain;charset=utf-8');
        }
        return data;
    }

    try {
        const ans = JSON.stringify(data);
        if (res) {
            res.setHeader('Content-Type', 'application/json;charset=utf-8');
        }
        return ans
    } catch (e) {
        return data;
    }
}

export default class fw {
    private _app: http.Server | undefined;
    private _routes: RoutesType[] = [];

    constructor() {
        if (typeof process === 'undefined') {
            throw new Error('This framework can only be run in Node.js');
        }
    }


    public registerRouter(routerDir: string) {
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
    private async callMiddleWire(middleWires: MiddleWireArray, req: Request, res: Response, error: Error): Promise<void>
    private async callMiddleWire(middleWires: MiddleWireArray, req: Request, res: Response): Promise<void>
    private async callMiddleWire(middleWires: MiddleWireArray, req: Request, res: Response, error?: Error) {
        const routePath = url.parse(req.url || '', true).pathname || '';
        middleWires.forEach(async (middleWire) => {
            if (!this.stringEqual(routePath, middleWire.routePath)) {
                return;
            }
            if (error) {
                (await (middleWire.middleWire as ErrorMiddleWire))(error, req, res);
            } else {
                (await (middleWire.middleWire as MiddleWire))(req, res);
            }
        });
    }
    public listen(port: number, callback: () => void) {

        // console.dir(this._routes, {depth: null});
        this._app = http.createServer((req, res) => {
            let chunk: Uint8Array[] = [];
            req.on('data', (chunk2) => {
                chunk.push(chunk2);
            })
            req.on('end', async () => {
                let parsedUrl = url.parse(req.url || '', true);
                let pathname = parsedUrl.pathname || '';
                let method = req.method || '';
                let params = parsedUrl.query;
                let route = this._routes.find(route => {
                    if (route.method === method) {
                        return this.stringEqual(pathname, route.routePath);
                    }
                    return false;
                });
                // console.log(this.__beforeRequestMiddleWire);


                if (!route) {
                    if (this.__errorMiddleWire.length > 0) {
                        this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Route ${method} ${pathname} not found`));
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
                        res.statusCode = 404;
                        res.end(`Route ${pathname} not found`);
                    }
                    return;
                }
                // this.__beforeRequestMiddleWire.forEach(async (middleWire) => {
                //     (await middleWire)(req, res);
                // });
                await this.callMiddleWire(this.__beforeRequestMiddleWire, req, res);

                let args: any[] = [];
                if (route.params) {
                    for (let param of route.params) {
                        let value = params[param.name];
                        if (value === undefined && param.required) {
                            if (this.__errorMiddleWire.length > 0) {
                                this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Param ${param.name} is required`));
                            } else {
                                res.writeHead(400, { 'Content-Type': 'text/plain;charset=utf-8' });
                                res.statusCode = 400;
                                res.end(`Param ${param.name} is required`);
                            }
                            return;
                        }
                        if (param.checkFunction && !param.checkFunction(value)) {
                            if (this.__errorMiddleWire.length > 0) {
                                this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Param ${param.name} is invalid`));
                            } else {
                                res.writeHead(400, { 'Content-Type': 'text/plain;charset=utf-8' });
                                res.statusCode = 400;
                                res.end(`Param ${param.name} is invalid`);
                            }
                            return;
                        }
                        args[param.index] = value || param.defaultValue;
                    }
                }

                if (route.bodys) {
                    let value: { [key: string]: any } = {};
                    if (req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
                        value = JSON.parse(Buffer.concat(chunk).toString());
                    } else if (req.headers['content-type']?.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
                        const bodyString = Buffer.concat(chunk).toString();
                        for (const [key, bodyValue] of new URLSearchParams(bodyString).entries()) {
                            value[key] = bodyValue;
                        }
                    }
                    if (Object.keys(value).length !== 0) {
                        for (let body of route.bodys) {
                            if (body.required && value[body.name] === undefined) {
                                if (this.__errorMiddleWire.length > 0) {
                                    this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Post body ${body.name} is required`));
                                } else {
                                    res.writeHead(400, { 'Content-Type': 'text/plain;charset=utf-8' });
                                    res.statusCode = 400;
                                    res.end(`Body ${body.name} is required`);
                                }
                                return;
                            }
                            args[body.index] = value[body.name] || body.defaultValue;
                        }
                    }
                }

                if (route.optionsSetter) {
                    for (let optionsSetter of route.optionsSetter) {
                        args[optionsSetter.index] = new OptionsSetter(res);
                    }
                }

                if(route.req){
                    for (let req2 of route.req) {
                        args[req2.index] = req;
                    }
                }
                if(route.res){
                    for (let res2 of route.res) {
                        args[res2.index] = res;
                    }
                }

                const handlerResponse = await route.handler.apply(null, args);
                if (handlerResponse !== undefined) {
                    const handlerResponseData = tryToString(handlerResponse, res);
                    res.end(handlerResponseData);
                }
            })
        });
        this._app.listen(port, callback);
    }

    public RestfulApi<T>(routePath: string = "") {
        return (controller: new (...args: any[]) => T) => {
            const prototype = controller.prototype;
            const propertyNames = Object.getOwnPropertyNames(prototype);
            for (const propertyName of propertyNames) {
                const property = prototype[propertyName];
                const method = Reflect.getMetadata('__method', property);
                const beforeRequest = Reflect.getMetadata('__beforeRequest', property) as MiddleWire[] || [];
                beforeRequest.forEach((middleWire) => {
                    this.beforeRequest(routePath + Reflect.getMetadata('__routePath', property), middleWire);
                });
                if (propertyName !== 'constructor' && typeof property === 'function' && method) {
                    this._routes.push({
                        routePath: routePath + Reflect.getMetadata('__routePath', property),
                        handler: property,
                        method: method,
                        params: Reflect.getMetadata('__params', property) || [],
                        bodys: Reflect.getMetadata('__bodys', property) || [],
                        optionsSetter: Reflect.getMetadata('__optionsSetter', property) || [],
                        req: Reflect.getMetadata('__req', property) || [],
                        res: Reflect.getMetadata('__res', property) || []
                    });
                }
            }
        }
    }

    public param<T>(param: ParamType) {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            // param.required = param.required || true;
            const api = (target as any)[propertyKey];
            let params = Reflect.getMetadata('__params', api) || [];
            params.push({ ...param, index: parameterIndex });
            Reflect.defineMetadata('__params', params, api);
        }
    }

    public body<T>(body: BodyType) {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            body.required = body.required || true;
            const api = (target as any)[propertyKey];
            let bodys = Reflect.getMetadata('__bodys', api) || [];
            bodys.push({ ...body, index: parameterIndex });
            Reflect.defineMetadata('__bodys', bodys, api);
        }
    }

    public optionsSetter<T>() {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            const api = (target as any)[propertyKey];
            let optionsSetter: OptionsSetterWithIndexType[] = Reflect.getMetadata('__optionsSetter', api) || [];
            optionsSetter.push({ index: parameterIndex });
            Reflect.defineMetadata('__optionsSetter', optionsSetter, api);
        }
    }

    public res<T>(){
        return function (target: T, propertyKey: string, parameterIndex: number) {
            const api = (target as any)[propertyKey];
            let res: ResponseWithIndexType[] = Reflect.getMetadata('__res', api) || [];
            res.push({ index: parameterIndex });
            Reflect.defineMetadata('__res', res, api);
        }
    }

    public req<T>(){
        return function (target: T, propertyKey: string, parameterIndex: number) {
            const api = (target as any)[propertyKey];
            let req: RequestWithIndexType[] = Reflect.getMetadata('__req', api) || [];
            req.push({ index: parameterIndex });
            Reflect.defineMetadata('__req', req, api);
        }
    }

    public urlParam<T>(param: UrlParamType) {

    }



    public get<T>(routePath: string | RegExp = "", beforeRequest?: MiddleWire | MiddleWire[]) {
        const self = this;
        // console.log(routePath);

        return function (target: T, propertyKey: string, descriptor: PropertyDescriptor) {
            Reflect.defineMetadata('__routePath', routePath, descriptor.value);
            Reflect.defineMetadata('__method', 'GET', descriptor.value);
            if (beforeRequest) {
                if (Array.isArray(beforeRequest)) {
                    Reflect.defineMetadata('__beforeRequest', beforeRequest, descriptor.value);
                } else {
                    Reflect.defineMetadata('__beforeRequest', [beforeRequest], descriptor.value);
                }
            }
        }
    }


    public post<T>(routePath: string | RegExp = "", beforeRequest?: MiddleWire | MiddleWire[]) {
        const self = this;
        return function (target: T, propertyKey: string, descriptor: PropertyDescriptor) {
            Reflect.defineMetadata('__routePath', routePath, descriptor.value);
            Reflect.defineMetadata('__method', 'POST', descriptor.value);
            if (beforeRequest) {
                if (Array.isArray(beforeRequest)) {
                    Reflect.defineMetadata('__beforeRequest', beforeRequest, descriptor.value);
                } else {
                    Reflect.defineMetadata('__beforeRequest', [beforeRequest], descriptor.value);
                }
            }
        }
    }

    private __errorMiddleWire: MiddleWireArray = []
    private __beforeRequestMiddleWire: MiddleWireArray = []
    private __afterRequestMiddleWire: MiddleWireArray = []
    public onError(routePath: string | RegExp, errorMiddleWire: ErrorMiddleWire): void
    public onError(errorMiddleWire: ErrorMiddleWire): void
    public onError(routePath: string | RegExp | ErrorMiddleWire, errorMiddleWire?: ErrorMiddleWire) {
        if (typeof routePath === 'function') {
            this.__errorMiddleWire.push({
                routePath: '*',
                middleWire: routePath
            });
        } else if (typeof routePath === 'string' || routePath instanceof RegExp) {
            this.__errorMiddleWire.push({
                routePath: routePath,
                middleWire: errorMiddleWire as ErrorMiddleWire
            });
        } else {
            throw new Error('Invalid parameter');
        }
    }
    public beforeRequest(routePath: string | RegExp, middleWire: MiddleWire): void
    public beforeRequest(middleWire: MiddleWire): void
    public beforeRequest(routePath: string | RegExp | MiddleWire, middleWire?: MiddleWire) {
        if (typeof routePath === 'function') {
            this.__beforeRequestMiddleWire.push({
                routePath: '*',
                middleWire: routePath
            });
        } else if (typeof routePath === 'string' || routePath instanceof RegExp) {
            this.__beforeRequestMiddleWire.push({
                routePath: routePath,
                middleWire: middleWire as MiddleWire
            });
        } else {
            throw new Error('Invalid parameter');
        }
    }

    private stringEqual(a: string, b: string | RegExp) {
        if (b === "*") return true;
        if (b instanceof RegExp) {
            return b.test(a);
        }
        // '/a/aaaa' is equal to '/a/*'
        if (b.endsWith('/*')) {
            return a.startsWith(b.slice(0, -1));
        }
        // '/a/123' is equal to '/a/:id'

        return a === b;
    }

}


export class OptionsSetter {
    private headers?: { [key: string]: string };
    private statusCode?: number;
    private res: Response;
    constructor(res: Response) {
        this.res = res;
    }
    setHeaders(headers: { [key: string]: string }) {
        this.headers = headers;
        for (let key in headers) {
            this.res.setHeader(key, headers[key]);
        }
    }
    pushHeaders(headers: { [key: string]: string }) {
        if (!this.headers) {
            this.headers = {};
        }
        this.headers = { ...this.headers, ...headers };
        for (let key in headers) {
            this.res.setHeader(key, headers[key]);
        }
    }
    setStatusCode(statusCode: number) {
        // this.statusCode = statusCode;
        this.res.statusCode = statusCode
    }
}