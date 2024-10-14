import * as http from 'http';
import "reflect-metadata";
export declare class InternetError extends Error {
    statusCode?: number;
    constructor(message: string, statusCode?: number);
}
declare interface ParamType {
    name: string;
    required?: boolean;
    defaultValue?: any;
    checkFunction?: (value: any) => boolean;
}
interface ParamWithIndexType extends ParamType {
    index: number;
}
declare interface BodyType extends ParamType {
}
declare interface BodyWithIndexType extends BodyType {
    index: number;
}
declare interface UrlParamType {
    name: string;
    checkFunction?: (value: any) => boolean;
}
declare interface UrlParamWithIndexType extends UrlParamType {
    index: number;
}
declare interface OptionsSetterWithIndexType {
    index: number;
}
export declare interface Request extends http.IncomingMessage {
}
export declare interface Response extends http.ServerResponse {
}
interface RequestWithIndexType {
    index: number;
}
interface ResponseWithIndexType {
    index: number;
}
interface CustomArgumentType {
    id: string;
    handler: (req: Request, res: Response, metadata: {
        index: number;
        value: any;
    }) => any;
}
export declare interface RoutesType {
    method: string;
    handler: (...args: any[]) => HandlerResponse | Promise<HandlerResponse>;
    routePath: string | RegExp;
    params?: ParamWithIndexType[];
    bodys?: BodyWithIndexType[];
    optionsSetter?: OptionsSetterWithIndexType[];
    req?: RequestWithIndexType[];
    res?: ResponseWithIndexType[];
    urlParams?: UrlParamWithIndexType[];
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
export declare type ErrorMiddleWire = (err: InternetError, res: Request, req: Response) => any | Promise<any>;
export declare type MiddleWire = (res: Request, req: Response) => any | Promise<any>;
export default class fw {
    private _app;
    private _routes;
    constructor();
    registerRouter(routerDir: string): void;
    private callMiddleWire;
    listen(port: number, callback: () => void): void;
    RestfulApi<T>(routePath?: string): (controller: new (...args: any[]) => T) => void;
    param<T>(param: ParamType): (target: T, propertyKey: string, parameterIndex: number) => void;
    body<T>(body: BodyType): (target: T, propertyKey: string, parameterIndex: number) => void;
    optionsSetter<T>(): (target: T, propertyKey: string, parameterIndex: number) => void;
    res<T>(): (target: T, propertyKey: string, parameterIndex: number) => void;
    req<T>(): (target: T, propertyKey: string, parameterIndex: number) => void;
    urlParam<T>(param: UrlParamType): (target: T, propertyKey: string, parameterIndex: number) => void;
    get<T>(routePath?: string | RegExp, beforeRequest?: MiddleWire | MiddleWire[]): (target: T, propertyKey: string, descriptor: PropertyDescriptor) => void;
    post<T>(routePath?: string | RegExp, beforeRequest?: MiddleWire | MiddleWire[]): (target: T, propertyKey: string, descriptor: PropertyDescriptor) => void;
    private __errorMiddleWire;
    private __beforeRequestMiddleWire;
    private __beforeRouteMiddleWire;
    private __afterRequestMiddleWire;
    onError(routePath: string | RegExp, errorMiddleWire: ErrorMiddleWire): void;
    onError(errorMiddleWire: ErrorMiddleWire): void;
    beforeRequest(routePath: string | RegExp, middleWire: MiddleWire): void;
    beforeRequest(middleWire: MiddleWire): void;
    private stringEqual;
    private __customArguments;
    defineArgument(customArgument: CustomArgumentType): void;
}
export declare class OptionsSetter {
    private headers?;
    private statusCode?;
    private res;
    constructor(res: Response);
    setHeaders(headers: {
        [key: string]: string;
    }): void;
    pushHeaders(headers: {
        [key: string]: string;
    }): void;
    setStatusCode(statusCode: number): void;
}
export {};
