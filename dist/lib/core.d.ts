import * as http from 'http';
import "reflect-metadata";
export declare class InternetError extends Error {
    statusCode?: number;
    constructor(message: string, statusCode?: number);
}
/**
 * GET请求的URL参数
 */
declare interface ParamType {
    /** 参数名，是客户端发送给后端的参数对应的名称 */
    name: string;
    /** 是否必须，默认为false */
    required?: boolean;
    /** 默认值 */
    defaultValue?: any;
    /** 参数检查函数，如果返回false，抛出一个异常 */
    checkFunction?: (value: any) => boolean;
}
/**
 * POST请求的body参数
 */
declare interface BodyType {
    /** 参数名，是客户端发送给后端的参数对应的名称 */
    name: string;
    /** 是否必须，默认为false */
    required?: boolean;
    /** 默认值 */
    defaultValue?: any;
    /** 参数检查函数，如果返回false，抛出一个异常 */
    checkFunction?: (value: any) => boolean;
}
/**
 * URL参数，形如 /a/:id
 */
declare interface UrlParamType {
    /** 参数名，例如/a/:id中的id */
    name: string;
    /** 参数检查函数，如果返回false，抛出一个异常 */
    checkFunction?: (value: any) => boolean;
}
export declare interface Request extends http.IncomingMessage {
}
export declare interface Response extends http.ServerResponse {
}
/**
 * 自定义修饰器参数
 */
declare interface CustomArgumentType {
    /** 修饰器的id */
    id: string;
    /** 修饰器的处理函数 */
    handler: (req: Request, res: Response, metadata: {
        index: number;
        value: any;
    }) => any;
}
export declare interface HandlerResponse {
    data: any;
    options?: {
        headers?: {
            [key: string]: string;
        };
        statusCode?: number;
    };
}
/** 异常处理中间件 */
export declare type ErrorMiddleWire = (err: InternetError, res: Request, req: Response) => any | Promise<any>;
/** 通用中间件 */
export declare type MiddleWire = (res: Request, req: Response) => any | Promise<any>;
export default class fw {
    private _app;
    private _routes;
    constructor();
    /**
     * 注册路由，将整个指定文件夹下的文件注册到框架中
     * @param routerDir 路由文件夹路径
     * @example
     * ```ts
     * app.registerRouter(path.join(__dirname, 'router'));
     * ```
     */
    registerRouter(routerDir: string): void;
    private callMiddleWire;
    /**
     * 开始监听，启动服务器
     * @param port 监听端口
     * @param callback 成功回调
     */
    listen(port: number, callback: () => void): void;
    /**
     * 将一个类注册中的特定函数注册为接口
     * @param routePath 基础路由路径
     * @returns
     *
     */
    RestfulApi<T>(routePath?: string): (controller: new (...args: any[]) => T) => void;
    /**
     * 获取GET请求参数
     * @param param 参数配置项
     * @returns
     */
    param<T>(param: ParamType): (target: T, propertyKey: string, parameterIndex: number) => void;
    /**
     * 获取POST请求参数，自动解析application/json和x-www-form-urlencoded
     * @param body 参数配置项
     * @returns
     */
    body<T>(body: BodyType): (target: T, propertyKey: string, parameterIndex: number) => void;
    /**
     * 获取OptionsSetter，用于设置headers和statusCode等
     * @returns
     */
    optionsSetter<T>(): (target: T, propertyKey: string, parameterIndex: number) => void;
    /**
     * 获取请求Response对象
     * @returns
     */
    res<T>(): (target: T, propertyKey: string, parameterIndex: number) => void;
    /**
     * 获取请求Request对象
     * @returns
     */
    req<T>(): (target: T, propertyKey: string, parameterIndex: number) => void;
    /**
     * 获取URL参数，例如 /a/:id
     * @param param 参数配置项
     * @returns
     */
    urlParam<T>(param: UrlParamType): (target: T, propertyKey: string, parameterIndex: number) => void;
    /**
     * 将该函数注册为GET请求
     * @param routePath 路由路径
     * @param beforeRequest 请求前中间件，只对当前路由有效
     * @returns
     */
    get<T>(routePath?: string | RegExp, beforeRequest?: MiddleWire | MiddleWire[]): (target: T, propertyKey: string, descriptor: PropertyDescriptor) => void;
    /**
     * 将该函数注册为POST请求
     * @param routePath 路由路径
     * @param beforeRequest 请求前中间件，只对当前路由有效
     * @returns
     */
    post<T>(routePath?: string | RegExp, beforeRequest?: MiddleWire | MiddleWire[]): (target: T, propertyKey: string, descriptor: PropertyDescriptor) => void;
    private __errorMiddleWire;
    private __beforeRequestMiddleWire;
    private __beforeRouteMiddleWire;
    private __afterRequestMiddleWire;
    /**
     * 加载错误处理中间件
     * @param routePath 生效路径
     * @param errorMiddleWire 错误处理中间件
     */
    onError(routePath: string | RegExp, errorMiddleWire: ErrorMiddleWire): void;
    /**
     * 加载错误处理中间件
     * @param errorMiddleWire 错误处理中间件
     */
    onError(errorMiddleWire: ErrorMiddleWire): void;
    /**
     * 加载前置中间件
     * @param routePath 生效路径
     * @param middleWire 前置中间件
     * @returns
     *
     */
    beforeRequest(routePath: string | RegExp, middleWire: MiddleWire): void;
    /**
     * 加载前置中间件
     * @param middleWire 前置中间件
     * @returns
     */
    beforeRequest(middleWire: MiddleWire): void;
    private stringEqual;
    private __customArguments;
    /**
     * 定义一个自定义装饰器参数
     * @param customArgument 自定义参数配置项
     * @returns
     */
    defineArgument(customArgument: CustomArgumentType): void;
}
export declare class OptionsSetter {
    private headers?;
    private statusCode?;
    private res;
    constructor(res: Response);
    /**
     * 将header设置为指定值，会覆盖之前的值
     * @param headers headers
     */
    setHeaders(headers: {
        [key: string]: string;
    }): void;
    /**
     * 添加header，不会覆盖之前的值
     * @param headers headers
     */
    pushHeaders(headers: {
        [key: string]: string;
    }): void;
    /**
     * 设置HTTP状态码
     * @param statusCode HTTP状态码
     */
    setStatusCode(statusCode: number): void;
}
export {};
