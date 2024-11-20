import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import "reflect-metadata"


export class InternetError extends Error {
    statusCode?: number
    constructor(message: string, statusCode?: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

/**
 * GET请求的URL参数
 */
declare interface ParamType {
    /** 参数名，是客户端发送给后端的参数对应的名称 */
    name: string,
    /** 是否必须，默认为false */
    required?: boolean,
    /** 默认值 */
    defaultValue?: any,
    /** 参数检查函数，如果返回false，抛出一个异常 */
    checkFunction?: (value: any) => boolean
}
interface ParamWithIndexType extends ParamType {
    index: number
}
/**
 * POST请求的body参数
 */
declare interface BodyType {
    /** 参数名，是客户端发送给后端的参数对应的名称 */
    name: string,
    /** 是否必须，默认为false */
    required?: boolean,
    /** 默认值 */
    defaultValue?: any,
    /** 参数检查函数，如果返回false，抛出一个异常 */
    checkFunction?: (value: any) => boolean
}
interface BodyWithIndexType extends BodyType {
    index: number
}
/**
 * URL参数，形如 /a/:id
 */
declare interface UrlParamType {
    /** 参数名，例如/a/:id中的id */
    name: string,
    /** 参数检查函数，如果返回false，抛出一个异常 */
    checkFunction?: (value: any) => boolean
}
interface UrlParamWithIndexType extends UrlParamType {
    index: number
}
interface OptionsSetterWithIndexType {
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
/**
 * 自定义修饰器参数
 */
declare interface CustomArgumentType {
    /** 修饰器的id */
    id: string,
    /** 修饰器的处理函数 */
    handler: (
        req: Request,
        res: Response,
        metadata: { index: number, value: any }) => any
}
interface RoutesType {
    method: string,
    handler: (...args: any[]) => HandlerResponse | Promise<HandlerResponse>,
    routePath: string | RegExp,
    params?: ParamWithIndexType[],
    bodys?: BodyWithIndexType[],
    optionsSetter?: OptionsSetterWithIndexType[],
    req?: RequestWithIndexType[],
    res?: ResponseWithIndexType[]
    urlParams?: UrlParamWithIndexType[]
}
export declare interface HandlerResponse {
    data: any,
    options?: {
        headers?: { [key: string]: string },
        statusCode?: number
    }
}
/** 异常处理中间件 */
export declare type ErrorMiddleWire = (err: InternetError, res: Request, req: Response) => any | Promise<any>
/** 通用中间件 */
export declare type MiddleWire = (res: Request, req: Response) => any | Promise<any>
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
        console.log(e);
        
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

    /**
     * 注册路由，将整个指定文件夹下的文件注册到框架中
     * @param routerDir 路由文件夹路径
     * @example
     * ```ts
     * app.registerRouter(path.join(__dirname, 'router'));
     * ```
     */
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

    private async callMiddleWire(middleWires: MiddleWireArray, req: Request, res: Response, error: InternetError): Promise<any>
    private async callMiddleWire(middleWires: MiddleWireArray, req: Request, res: Response): Promise<any>
    private async callMiddleWire(middleWires: MiddleWireArray, req: Request, res: Response, error?: InternetError) {
        const routePath = url.parse(req.url || '', true).pathname || '';
        for (let i = 0; i < middleWires.length; i++) {
            const middleWire = middleWires[i];
            if (!this.stringEqual(routePath, middleWire.routePath)) {
                continue;
            }
            let flag: any = undefined
            if (error) {
                flag = await (middleWire.middleWire as ErrorMiddleWire)(error, req, res);
            } else {
                flag = await (middleWire.middleWire as MiddleWire)(req, res);
            }
            if (flag) return flag;
        }
    }

    /**
     * 开始监听，启动服务器
     * @param port 监听端口
     * @param callback 成功回调
     */
    public listen(port: number, callback: () => void) {

        // console.dir(this._routes, {depth: null});
        this._app = http.createServer((req, res) => {
            let chunk: Uint8Array[] = [];
            req.on('data', (chunk2) => {
                chunk.push(chunk2);
            })
            req.on('end', async () => {
                let flag: any = undefined
                flag = await this.callMiddleWire(this.__beforeRequestMiddleWire, req, res);
                if (flag) return


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
                        flag = this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Route ${method} ${pathname} not found`));
                        if (flag) return;
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
                        res.statusCode = 404;
                        res.end(`Route ${pathname} not found`);
                    }
                    return;
                }

                // console.log('route', route);
                
                // this.__beforeRequestMiddleWire.forEach(async (middleWire) => {
                //     (await middleWire)(req, res);
                // });
                // flag = await this.callMiddleWire(this.__beforeRequestMiddleWire, req, res);
                // if(flag) return;

                let args: any[] = [];
                if (route.params) {
                    for (let param of route.params) {
                        let value = params[param.name];
                        if (value === undefined && param.required) {
                            if (this.__errorMiddleWire.length > 0) {
                                flag = this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Param ${param.name} is required`));
                                if (flag) return;
                            } else {
                                res.writeHead(400, { 'Content-Type': 'text/plain;charset=utf-8' });
                                res.statusCode = 400;
                                res.end(`Param ${param.name} is required`);
                            }
                            return;
                        }
                        if (param.checkFunction && !param.checkFunction(value)) {
                            if (this.__errorMiddleWire.length > 0) {
                                flag = this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Param ${param.name} is invalid`));
                                if (flag) return;
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
                                    flag = this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`body ${body.name} is required`));
                                    if (flag) return;
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


                if (route.urlParams && typeof route.routePath === 'string') {
                    function getParams(routePath: string, pathname: string) {
                        const routePathArray = routePath.split('/');
                        const pathnameArray = pathname.split('/');
                        const params: { [key: string]: string } = {};
                        for (let i = 0; i < routePathArray.length; i++) {
                            if (routePathArray[i].startsWith(':')) {
                                params[routePathArray[i].slice(1)] = pathnameArray[i];
                            }
                        }
                        return params;
                    }
                    const urlParams = getParams(route.routePath, pathname);
                    for (let urlParam of route.urlParams) {
                        let value = urlParams[urlParam.name];
                        if (urlParam.checkFunction && !urlParam.checkFunction(value)) {
                            if (this.__errorMiddleWire.length > 0) {
                                flag = this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Param ${urlParam.name} is invalid`));
                                if (flag) return;
                            } else {
                                res.writeHead(400, { 'Content-Type': 'text/plain;charset=utf-8' });
                                res.statusCode = 400;
                                res.end(`Param ${urlParam.name} is invalid`);
                            }
                            return;
                        }
                        args[urlParam.index] = value;
                    }
                }

                if (route.optionsSetter) {
                    for (let optionsSetter of route.optionsSetter) {
                        args[optionsSetter.index] = new OptionsSetter(res);
                    }
                }

                if (route.req) {
                    for (let req2 of route.req) {
                        args[req2.index] = req;
                    }
                }
                if (route.res) {
                    for (let res2 of route.res) {
                        args[res2.index] = res;
                    }
                }

                if (this.__customArguments.length > 0) {
                    for (let customArgument of this.__customArguments) {
                        const metadata: { index: number, value: any } | undefined = Reflect.getMetadata(customArgument.id, route.handler);
                        if (metadata === undefined) continue;
                        if (typeof metadata.index !== 'number') {
                            throw new Error('custom argument decorator must be defined such a metadata: {index: number, value: any}');
                        }
                        try {
                            args[metadata.index] = customArgument.handler(req, res, metadata);
                        } catch (error: any) {
                            if (this.__errorMiddleWire.length > 0) {
                                flag = this.callMiddleWire(this.__errorMiddleWire, req, res, error);
                                if (flag) return;
                            } else {
                                res.writeHead(500, { 'Content-Type': 'text/plain;charset=utf-8' });
                                res.statusCode = 500;
                                res.end(error.message);
                            }
                            return;
                        }
                    }
                }

                const handlerResponse = await route.handler.apply(null, args);

                flag = await this.callMiddleWire(this.__afterRequestMiddleWire, req, res);
                if (flag) return;


                if (handlerResponse !== undefined) {
                    const handlerResponseData = tryToString(handlerResponse, res);
                    console.log(handlerResponseData);
                    
                    res.end(handlerResponseData);
                }
            })
        });
        this._app.listen(port, callback);
    }

    /**
     * 将一个类注册中的特定函数注册为接口
     * @param routePath 基础路由路径
     * @returns 
     * 
     */
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
                        res: Reflect.getMetadata('__res', property) || [],
                        urlParams: Reflect.getMetadata('__urlParams', property) || []
                    });
                }
            }
        }
    }

    /**
     * 获取GET请求参数
     * @param param 参数配置项
     * @returns 
     */
    public param<T>(param: ParamType) {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            // param.required = param.required || true;
            const api = (target as any)[propertyKey];
            let params = Reflect.getMetadata('__params', api) || [];
            params.push({ ...param, index: parameterIndex });
            Reflect.defineMetadata('__params', params, api);
        }
    }

    /**
     * 获取POST请求参数，自动解析application/json和x-www-form-urlencoded
     * @param body 参数配置项
     * @returns 
     */
    public body<T>(body: BodyType) {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            // body.required = body.required || true;
            const api = (target as any)[propertyKey];
            let bodys = Reflect.getMetadata('__bodys', api) || [];
            bodys.push({ ...body, index: parameterIndex });
            Reflect.defineMetadata('__bodys', bodys, api);
        }
    }

    /**
     * 获取OptionsSetter，用于设置headers和statusCode等
     * @returns 
     */
    public optionsSetter<T>() {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            const api = (target as any)[propertyKey];
            let optionsSetter: OptionsSetterWithIndexType[] = Reflect.getMetadata('__optionsSetter', api) || [];
            optionsSetter.push({ index: parameterIndex });
            Reflect.defineMetadata('__optionsSetter', optionsSetter, api);
        }
    }

    /**
     * 获取请求Response对象
     * @returns 
     */
    public res<T>() {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            const api = (target as any)[propertyKey];
            let res: ResponseWithIndexType[] = Reflect.getMetadata('__res', api) || [];
            res.push({ index: parameterIndex });
            Reflect.defineMetadata('__res', res, api);
        }
    }

    /**
     * 获取请求Request对象
     * @returns 
     */
    public req<T>() {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            const api = (target as any)[propertyKey];
            let req: RequestWithIndexType[] = Reflect.getMetadata('__req', api) || [];
            req.push({ index: parameterIndex });
            Reflect.defineMetadata('__req', req, api);
        }
    }

    /**
     * 获取URL参数，例如 /a/:id
     * @param param 参数配置项
     * @returns 
     */
    public urlParam<T>(param: UrlParamType) {
        return function (target: T, propertyKey: string, parameterIndex: number) {
            const api = (target as any)[propertyKey];
            let urlParams = Reflect.getMetadata('__urlParams', api) || [];
            urlParams.push({ name: param.name, checkFunction: param.checkFunction, index: parameterIndex });
            Reflect.defineMetadata('__urlParams', urlParams, api);
        }
    }



    /**
     * 将该函数注册为GET请求
     * @param routePath 路由路径
     * @param beforeRequest 请求前中间件，只对当前路由有效
     * @returns 
     */
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


    /**
     * 将该函数注册为POST请求
     * @param routePath 路由路径
     * @param beforeRequest 请求前中间件，只对当前路由有效
     * @returns 
     */
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

    /**
     * 将该函数注册为PUT请求
     * @param routePath 路由路径
     * @param beforeRequest 请求前中间件，只对当前路由有效
     * @returns 
     */
    public put<T>(routePath: string | RegExp = "", beforeRequest?: MiddleWire | MiddleWire[]) {
        const self = this;
        return function (target: T, propertyKey: string, descriptor: PropertyDescriptor) {
            Reflect.defineMetadata('__routePath', routePath, descriptor.value);
            Reflect.defineMetadata('__method', 'PUT', descriptor.value);
            if (beforeRequest) {
                if (Array.isArray(beforeRequest)) {
                    Reflect.defineMetadata('__beforeRequest', beforeRequest, descriptor.value);
                } else {
                    Reflect.defineMetadata('__beforeRequest', [beforeRequest], descriptor.value);
                }
            }
        }
    }


    /**
     * 将该函数注册为DELETE请求
     * @param routePath 路由路径
     * @param beforeRequest 请求前中间件，只对当前路由有效
     * @returns 
     */
    public delete<T>(routePath: string | RegExp = "", beforeRequest?: MiddleWire | MiddleWire[]) {
        const self = this;
        return function (target: T, propertyKey: string, descriptor: PropertyDescriptor) {
            Reflect.defineMetadata('__routePath', routePath, descriptor.value);
            Reflect.defineMetadata('__method', 'DELETE', descriptor.value);
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
    // private __beforeRouteMiddleWire: MiddleWireArray = []
    private __afterRequestMiddleWire: MiddleWireArray = []


    /**
     * 加载错误处理中间件
     * @param routePath 生效路径
     * @param errorMiddleWire 错误处理中间件
     */
    public onError(routePath: string | RegExp, errorMiddleWire: ErrorMiddleWire): void
    /**
     * 加载错误处理中间件
     * @param errorMiddleWire 错误处理中间件
     */
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

    /**
     * 加载前置中间件
     * @param routePath 生效路径
     * @param middleWire 前置中间件
     * @returns
     * 
     */
    public beforeRequest(routePath: string | RegExp, middleWire: MiddleWire): void
    /**
     * 加载前置中间件
     * @param middleWire 前置中间件
     * @returns
     */
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

    /**
     * 加载后置中间件
     * @param routePath 生效路径
     * @param middleWire 后置中间件
     */
    public afterRequest(routePath: string | RegExp, middleWire: MiddleWire): void
    /**
     * 加载后置中间件
     * @param middleWire 后置中间件
     */
    public afterRequest(middleWire: MiddleWire): void
    public afterRequest(routePath: string | RegExp | MiddleWire, middleWire?: MiddleWire) {
        if (typeof routePath === 'function') {
            this.__afterRequestMiddleWire.push({
                routePath: '*',
                middleWire: routePath
            });
        } else if (typeof routePath === 'string' || routePath instanceof RegExp) {
            this.__afterRequestMiddleWire.push({
                routePath: routePath,
                middleWire: middleWire as MiddleWire
            });
        } else {
            throw new Error('Invalid parameter');
        }
    }

    // public beforeRoute(routePath: string | RegExp, middleWire: MiddleWire): void
    // public beforeRoute(middleWire: MiddleWire): void
    // public beforeRoute(routePath: string | RegExp | MiddleWire, middleWire?: MiddleWire) {
    //     if (typeof routePath === 'function') {
    //         this.__beforeRouteMiddleWire.push({
    //             routePath: '*',
    //             middleWire: routePath
    //         });
    //     } else if (typeof routePath === 'string' || routePath instanceof RegExp) {
    //         this.__beforeRouteMiddleWire.push({
    //             routePath: routePath,
    //             middleWire: middleWire as MiddleWire
    //         });
    //     } else {
    //         throw new Error('Invalid parameter');
    //     }
    // }

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
        if (typeof b === 'string' && b.includes(':')) {
            const aArray = a.split('/');
            const bArray = b.split('/');
            if (aArray.length === bArray.length) {
                let flag = true;
                for (let i = 0; i < aArray.length; i++) {
                    if (bArray[i].startsWith(':')) continue;
                    if (aArray[i] !== bArray[i]) {
                        flag = false;
                        break;
                    }
                }
                if (flag) return true;
            }
        }
        return a === b;
    }
    private __customArguments: CustomArgumentType[] = []
    /**
     * 定义一个自定义装饰器参数
     * @param customArgument 自定义参数配置项
     * @returns
     */
    public defineArgument(customArgument: CustomArgumentType) {
        this.__customArguments.push(customArgument);
    }
}


export class OptionsSetter {
    private headers?: { [key: string]: string };
    private statusCode?: number;
    private res: Response;
    constructor(res: Response) {
        this.res = res;
    }
    /**
     * 将header设置为指定值，会覆盖之前的值
     * @param headers headers
     */
    setHeaders(headers: { [key: string]: string }) {
        this.headers = headers;
        for (let key in headers) {
            this.res.setHeader(key, headers[key]);
        }
    }
    /**
     * 添加header，不会覆盖之前的值
     * @param headers headers
     */
    pushHeaders(headers: { [key: string]: string }) {
        if (!this.headers) {
            this.headers = {};
        }
        this.headers = { ...this.headers, ...headers };
        for (let key in headers) {
            this.res.setHeader(key, headers[key]);
        }
    }
    /**
     * 设置HTTP状态码
     * @param statusCode HTTP状态码
     */
    setStatusCode(statusCode: number) {
        // this.statusCode = statusCode;
        this.res.statusCode = statusCode
    }
}