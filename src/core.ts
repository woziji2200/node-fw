import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';

declare interface param {
    name: string,
    type: any,
    required: boolean,
    defaultValue: any
}
interface paramIndex extends param {
    index: number
}
export default class fw {

    private _app: http.Server | undefined;
    private _routes: {
        method: string,
        handler: Function,
        routePath: url.URL | string,
        params?: paramIndex[]
    }[] = [];

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

    listen(port: number, callback: Function) {
        console.log(this._routes);
    }


    RestfulApi(controllerOrRoutePath: string): (controller: any, context: ClassDecoratorContext) => void;
    RestfulApi(controllerOrRoutePath: any, context: ClassDecoratorContext): void;
    RestfulApi(controllerOrRoutePath: any, context?: any) {
        interface ControllerClass { name: string, handler: Function, routePath: string, method: string };
        const getApis = <T>(cls: new (...args: any[]) => T): ControllerClass[] => {
            const prototype = cls.prototype;
            const methods: ControllerClass[] = [];
            // 获取类原型链上的所有属性
            const propertyNames = Object.getOwnPropertyNames(prototype);
            // 遍历这些属性并筛选出方法
            for (const propertyName of propertyNames) {
                const property = prototype[propertyName];
                const routePath = Object.getOwnPropertyDescriptor(property, '__routePath')?.value;
                const method = Object.getOwnPropertyDescriptor(property, '__method')?.value;
                // 过滤构造函数，确保属性是函数`
                if (propertyName !== 'constructor' && typeof property === 'function' && method) {
                    methods.push({
                        routePath: routePath,
                        name: propertyName,
                        handler: property,
                        method: method
                    });
                }
            }
            return methods;
        }

        const pushRoute = (controller: any, ctx: ClassDecoratorContext, routePath: string = '') => {
            if (ctx.kind !== 'class') throw new Error('This decorator can only be used on classes');
            let apis = getApis(controller);
            for (let api of apis) {
                this._routes.push({ method: api.method, handler: api.handler, routePath: routePath + api.routePath });
            }
        }
        if (typeof controllerOrRoutePath === 'string') {
            return (controller: any, context: ClassDecoratorContext) => {
                let routePath = controllerOrRoutePath;
                pushRoute(controller, context, routePath);
            }
        } else {
            let controller = controllerOrRoutePath;
            pushRoute(controller, context, '');
        }
    }

    RequestParams(params: param[]) {
        return (target: any, key: string, index: number) => {
            if (!target.__params) {
                target.__params = [];
            }
            target.__params.push({ name: key, type: params[index], required: true, defaultValue: undefined });
        }
    }

    RequestBody(){

    }

    required(){
        
    }

    Get(routePathOrHandler: string): (handler: Function, context: ClassMethodDecoratorContext) => void;
    Get(routePathOrHandler: Function, context: ClassMethodDecoratorContext): void;
    Get(routePathOrHandler: string | Function, context?: ClassMethodDecoratorContext) {
        const defineHandler = (handler: Function, context: ClassMemberDecoratorContext, routePath: string = '') => {
            if (context.kind !== 'method') throw new Error('This decorator can only be used on methods');
            Object.defineProperty(handler, '__routePath', { value: routePath });
            Object.defineProperty(handler, '__method', { value: 'GET' });
        }
        if (typeof routePathOrHandler === 'string') {
            return (handler: Function, context: ClassMethodDecoratorContext) => {
                const routePath = routePathOrHandler;
                defineHandler(handler, context, routePath);
            }
        } else {
            let handler = routePathOrHandler;
            defineHandler(handler, context as ClassMemberDecoratorContext, '');
        }
    }


    Post(routePath: string) {

    }
}