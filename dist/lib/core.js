"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsSetter = exports.InternetError = void 0;
const http = __importStar(require("http"));
const url = __importStar(require("url"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
require("reflect-metadata");
class InternetError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.InternetError = InternetError;
function tryToJSON(data) {
    const jsonReg = /^(\{|\[).*(\}|\])$/;
    try {
        if (jsonReg.test(data)) {
            return JSON.parse(data);
        }
    }
    catch (e) {
        return data;
    }
}
function tryToString(data, res) {
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
        return ans;
    }
    catch (e) {
        return data;
    }
}
class fw {
    constructor() {
        this._routes = [];
        this.__errorMiddleWire = [];
        this.__beforeRequestMiddleWire = [];
        this.__beforeRouteMiddleWire = [];
        this.__afterRequestMiddleWire = [];
        this.__customArguments = [];
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
    registerRouter(routerDir) {
        function requireFiles(dir) {
            fs.readdirSync(dir).forEach(file => {
                let filePath = path.join(dir, file);
                if (fs.statSync(filePath).isDirectory()) {
                    requireFiles(filePath);
                }
                else {
                    if (path.extname(filePath).toLowerCase() === '.js' || path.extname(filePath).toLowerCase() === '.ts') {
                        require(filePath);
                    }
                }
            });
        }
        requireFiles(routerDir);
    }
    callMiddleWire(middleWires, req, res, error) {
        return __awaiter(this, void 0, void 0, function* () {
            const routePath = url.parse(req.url || '', true).pathname || '';
            for (let i = 0; i < middleWires.length; i++) {
                const middleWire = middleWires[i];
                if (!this.stringEqual(routePath, middleWire.routePath)) {
                    continue;
                }
                let flag = undefined;
                if (error) {
                    flag = yield middleWire.middleWire(error, req, res);
                }
                else {
                    flag = yield middleWire.middleWire(req, res);
                }
                if (flag)
                    return flag;
            }
        });
    }
    /**
     * 开始监听，启动服务器
     * @param port 监听端口
     * @param callback 成功回调
     */
    listen(port, callback) {
        // console.dir(this._routes, {depth: null});
        this._app = http.createServer((req, res) => {
            let chunk = [];
            req.on('data', (chunk2) => {
                chunk.push(chunk2);
            });
            req.on('end', () => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                let flag = undefined;
                flag = yield this.callMiddleWire(this.__beforeRequestMiddleWire, req, res);
                if (flag)
                    return;
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
                        if (flag)
                            return;
                    }
                    else {
                        res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
                        res.statusCode = 404;
                        res.end(`Route ${pathname} not found`);
                    }
                    return;
                }
                // this.__beforeRequestMiddleWire.forEach(async (middleWire) => {
                //     (await middleWire)(req, res);
                // });
                // flag = await this.callMiddleWire(this.__beforeRequestMiddleWire, req, res);
                // if(flag) return;
                let args = [];
                if (route.params) {
                    for (let param of route.params) {
                        let value = params[param.name];
                        if (value === undefined && param.required) {
                            if (this.__errorMiddleWire.length > 0) {
                                flag = this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Param ${param.name} is required`));
                                if (flag)
                                    return;
                            }
                            else {
                                res.writeHead(400, { 'Content-Type': 'text/plain;charset=utf-8' });
                                res.statusCode = 400;
                                res.end(`Param ${param.name} is required`);
                            }
                            return;
                        }
                        if (param.checkFunction && !param.checkFunction(value)) {
                            if (this.__errorMiddleWire.length > 0) {
                                flag = this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Param ${param.name} is invalid`));
                                if (flag)
                                    return;
                            }
                            else {
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
                    let value = {};
                    if ((_a = req.headers['content-type']) === null || _a === void 0 ? void 0 : _a.toLowerCase().startsWith('application/json')) {
                        value = JSON.parse(Buffer.concat(chunk).toString());
                    }
                    else if ((_b = req.headers['content-type']) === null || _b === void 0 ? void 0 : _b.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
                        const bodyString = Buffer.concat(chunk).toString();
                        for (const [key, bodyValue] of new URLSearchParams(bodyString).entries()) {
                            value[key] = bodyValue;
                        }
                    }
                    if (Object.keys(value).length !== 0) {
                        for (let body of route.bodys) {
                            if (body.required && value[body.name] === undefined) {
                                if (this.__errorMiddleWire.length > 0) {
                                    flag = this.callMiddleWire(this.__errorMiddleWire, req, res, new Error(`Post body ${body.name} is required`));
                                    if (flag)
                                        return;
                                }
                                else {
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
                    function getParams(routePath, pathname) {
                        const routePathArray = routePath.split('/');
                        const pathnameArray = pathname.split('/');
                        const params = {};
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
                                if (flag)
                                    return;
                            }
                            else {
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
                        const metadata = Reflect.getMetadata(customArgument.id, route.handler);
                        if (metadata === undefined)
                            continue;
                        if (typeof metadata.index !== 'number') {
                            throw new Error('custom argument decorator must be defined such a metadata: {index: number, value: any}');
                        }
                        try {
                            args[metadata.index] = customArgument.handler(req, res, metadata);
                        }
                        catch (error) {
                            if (this.__errorMiddleWire.length > 0) {
                                flag = this.callMiddleWire(this.__errorMiddleWire, req, res, error);
                                if (flag)
                                    return;
                            }
                            else {
                                res.writeHead(500, { 'Content-Type': 'text/plain;charset=utf-8' });
                                res.statusCode = 500;
                                res.end(error.message);
                            }
                            return;
                        }
                    }
                }
                const handlerResponse = yield route.handler.apply(null, args);
                if (handlerResponse !== undefined) {
                    const handlerResponseData = tryToString(handlerResponse, res);
                    res.end(handlerResponseData);
                }
            }));
        });
        this._app.listen(port, callback);
    }
    /**
     * 将一个类注册中的特定函数注册为接口
     * @param routePath 基础路由路径
     * @returns
     *
     */
    RestfulApi(routePath = "") {
        return (controller) => {
            const prototype = controller.prototype;
            const propertyNames = Object.getOwnPropertyNames(prototype);
            for (const propertyName of propertyNames) {
                const property = prototype[propertyName];
                const method = Reflect.getMetadata('__method', property);
                const beforeRequest = Reflect.getMetadata('__beforeRequest', property) || [];
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
        };
    }
    /**
     * 获取GET请求参数
     * @param param 参数配置项
     * @returns
     */
    param(param) {
        return function (target, propertyKey, parameterIndex) {
            // param.required = param.required || true;
            const api = target[propertyKey];
            let params = Reflect.getMetadata('__params', api) || [];
            params.push(Object.assign(Object.assign({}, param), { index: parameterIndex }));
            Reflect.defineMetadata('__params', params, api);
        };
    }
    /**
     * 获取POST请求参数，自动解析application/json和x-www-form-urlencoded
     * @param body 参数配置项
     * @returns
     */
    body(body) {
        return function (target, propertyKey, parameterIndex) {
            body.required = body.required || true;
            const api = target[propertyKey];
            let bodys = Reflect.getMetadata('__bodys', api) || [];
            bodys.push(Object.assign(Object.assign({}, body), { index: parameterIndex }));
            Reflect.defineMetadata('__bodys', bodys, api);
        };
    }
    /**
     * 获取OptionsSetter，用于设置headers和statusCode等
     * @returns
     */
    optionsSetter() {
        return function (target, propertyKey, parameterIndex) {
            const api = target[propertyKey];
            let optionsSetter = Reflect.getMetadata('__optionsSetter', api) || [];
            optionsSetter.push({ index: parameterIndex });
            Reflect.defineMetadata('__optionsSetter', optionsSetter, api);
        };
    }
    /**
     * 获取请求Response对象
     * @returns
     */
    res() {
        return function (target, propertyKey, parameterIndex) {
            const api = target[propertyKey];
            let res = Reflect.getMetadata('__res', api) || [];
            res.push({ index: parameterIndex });
            Reflect.defineMetadata('__res', res, api);
        };
    }
    /**
     * 获取请求Request对象
     * @returns
     */
    req() {
        return function (target, propertyKey, parameterIndex) {
            const api = target[propertyKey];
            let req = Reflect.getMetadata('__req', api) || [];
            req.push({ index: parameterIndex });
            Reflect.defineMetadata('__req', req, api);
        };
    }
    /**
     * 获取URL参数，例如 /a/:id
     * @param param 参数配置项
     * @returns
     */
    urlParam(param) {
        return function (target, propertyKey, parameterIndex) {
            const api = target[propertyKey];
            let urlParams = Reflect.getMetadata('__urlParams', api) || [];
            urlParams.push({ name: param.name, checkFunction: param.checkFunction, index: parameterIndex });
            Reflect.defineMetadata('__urlParams', urlParams, api);
        };
    }
    /**
     * 将该函数注册为GET请求
     * @param routePath 路由路径
     * @param beforeRequest 请求前中间件，只对当前路由有效
     * @returns
     */
    get(routePath = "", beforeRequest) {
        const self = this;
        // console.log(routePath);
        return function (target, propertyKey, descriptor) {
            Reflect.defineMetadata('__routePath', routePath, descriptor.value);
            Reflect.defineMetadata('__method', 'GET', descriptor.value);
            if (beforeRequest) {
                if (Array.isArray(beforeRequest)) {
                    Reflect.defineMetadata('__beforeRequest', beforeRequest, descriptor.value);
                }
                else {
                    Reflect.defineMetadata('__beforeRequest', [beforeRequest], descriptor.value);
                }
            }
        };
    }
    /**
     * 将该函数注册为POST请求
     * @param routePath 路由路径
     * @param beforeRequest 请求前中间件，只对当前路由有效
     * @returns
     */
    post(routePath = "", beforeRequest) {
        const self = this;
        return function (target, propertyKey, descriptor) {
            Reflect.defineMetadata('__routePath', routePath, descriptor.value);
            Reflect.defineMetadata('__method', 'POST', descriptor.value);
            if (beforeRequest) {
                if (Array.isArray(beforeRequest)) {
                    Reflect.defineMetadata('__beforeRequest', beforeRequest, descriptor.value);
                }
                else {
                    Reflect.defineMetadata('__beforeRequest', [beforeRequest], descriptor.value);
                }
            }
        };
    }
    onError(routePath, errorMiddleWire) {
        if (typeof routePath === 'function') {
            this.__errorMiddleWire.push({
                routePath: '*',
                middleWire: routePath
            });
        }
        else if (typeof routePath === 'string' || routePath instanceof RegExp) {
            this.__errorMiddleWire.push({
                routePath: routePath,
                middleWire: errorMiddleWire
            });
        }
        else {
            throw new Error('Invalid parameter');
        }
    }
    beforeRequest(routePath, middleWire) {
        if (typeof routePath === 'function') {
            this.__beforeRequestMiddleWire.push({
                routePath: '*',
                middleWire: routePath
            });
        }
        else if (typeof routePath === 'string' || routePath instanceof RegExp) {
            this.__beforeRequestMiddleWire.push({
                routePath: routePath,
                middleWire: middleWire
            });
        }
        else {
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
    stringEqual(a, b) {
        if (b === "*")
            return true;
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
                    if (bArray[i].startsWith(':'))
                        continue;
                    if (aArray[i] !== bArray[i]) {
                        flag = false;
                        break;
                    }
                }
                if (flag)
                    return true;
            }
        }
        return a === b;
    }
    /**
     * 定义一个自定义装饰器参数
     * @param customArgument 自定义参数配置项
     * @returns
     */
    defineArgument(customArgument) {
        this.__customArguments.push(customArgument);
    }
}
exports.default = fw;
class OptionsSetter {
    constructor(res) {
        this.res = res;
    }
    /**
     * 将header设置为指定值，会覆盖之前的值
     * @param headers headers
     */
    setHeaders(headers) {
        this.headers = headers;
        for (let key in headers) {
            this.res.setHeader(key, headers[key]);
        }
    }
    /**
     * 添加header，不会覆盖之前的值
     * @param headers headers
     */
    pushHeaders(headers) {
        if (!this.headers) {
            this.headers = {};
        }
        this.headers = Object.assign(Object.assign({}, this.headers), headers);
        for (let key in headers) {
            this.res.setHeader(key, headers[key]);
        }
    }
    /**
     * 设置HTTP状态码
     * @param statusCode HTTP状态码
     */
    setStatusCode(statusCode) {
        // this.statusCode = statusCode;
        this.res.statusCode = statusCode;
    }
}
exports.OptionsSetter = OptionsSetter;
