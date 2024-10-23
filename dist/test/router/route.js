"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
exports.ApiController = exports.test = void 0;
const __1 = require("..");
// every controller must be decorated by @app.RestfulApi()
// 所有的控制器都必须使用@app.RestfulApi()装饰
let test = class test {
    // every method must be decorated by @app.get()
    // 每个方法都必须使用@app.get()装饰
    test() {
        // you just need to return a string or a object
        // 只需要返回一个字符串或对象
        return "You can see this message, because you have visited /test";
    }
    test_json() {
        // the return value will be converted to json
        // 返回值是object的将被转换为json
        return { message: "You can see this message, because you have visited /test_json" };
    }
    // you can set the before middleware by passing a function or an array of functions to @app.get()
    // 通过传递一个函数或函数数组给@app.get()，可以设置请求之前的中间件
    test_error() {
        return { message: "You can see this message, because you have visited /test_error" };
    }
};
exports.test = test;
__decorate([
    __1.app.get('/test')
], test.prototype, "test", null);
__decorate([
    __1.app.get('/test_json')
], test.prototype, "test_json", null);
__decorate([
    __1.app.get('/test_before', (req, res) => { console.log('test_before:', req.url); })
], test.prototype, "test_error", null);
exports.test = test = __decorate([
    __1.app.RestfulApi()
], test);
// you can set the base path of the controller by passing a string to @app.RestfulApi()
// 通过传递一个字符串给@app.RestfulApi()，可以设置控制器的base path
let ApiController = class ApiController {
    getUserInfo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return { id: id, name: 'test' };
        });
    }
    // url params
    // 路径参数
    getUserInfoByUrlParams(id, name) {
        return __awaiter(this, void 0, void 0, function* () {
            return { id: id, name: name };
        });
    }
    login(username, password, optionsSetter) {
        return __awaiter(this, void 0, void 0, function* () {
            optionsSetter.pushHeaders({ 'Authorization': 'Bearer 123456' });
            return { msg: 'login success' };
        });
    }
    isUserId1(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return { id: id, isUserId1: id == '1' };
        });
    }
    getNews(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return { id: id, title: 'news title', content: 'news content' };
        });
    }
    getReqRes(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('getReqRes:', req.url);
            res.end('手动结束请求');
            return;
        });
    }
};
exports.ApiController = ApiController;
__decorate([
    __1.app.get('/user'),
    __param(0, __1.app.param({ name: 'id', required: true }))
], ApiController.prototype, "getUserInfo", null);
__decorate([
    __1.app.get('/user/:id/:name'),
    __param(0, __1.app.urlParam({ name: 'id' })),
    __param(1, __1.app.urlParam({ name: 'name' }))
], ApiController.prototype, "getUserInfoByUrlParams", null);
__decorate([
    __1.app.post('/login'),
    __param(0, __1.app.body({ name: 'username', required: true })),
    __param(1, __1.app.body({ name: 'password', required: true })),
    __param(2, __1.app.optionsSetter())
], ApiController.prototype, "login", null);
__decorate([
    __1.app.get('/isUserId1'),
    __param(0, __1.app.param({ name: 'id', checkFunction: (value) => { return value == '1'; }, }))
], ApiController.prototype, "isUserId1", null);
__decorate([
    __1.app.get('/news'),
    __param(0, __1.app.param({ name: 'id', defaultValue: 1 }))
], ApiController.prototype, "getNews", null);
__decorate([
    __1.app.get('/req_res'),
    __param(0, __1.app.req()),
    __param(1, __1.app.res())
], ApiController.prototype, "getReqRes", null);
exports.ApiController = ApiController = __decorate([
    __1.app.RestfulApi('/api')
], ApiController);
// 可以自定义参数装饰器
__1.app.defineArgument({
    // id唯一标识了参数装饰器
    id: '__myArg',
    handler(req, res, metadata) {
        // 抛出异常会直接中断请求，被全局异常处理中间件捕获
        // throw new fw.InternetError('自定义参数装饰器', 233)
        return req.url + ": " + metadata.value;
    }
});
// 参数装饰器函数
const myArg = (mystring) => {
    return function (target, propertyKey, parameterIndex) {
        // 为目标函数的元数据添加metadata
        const api = target[propertyKey];
        // 添加的metadata的key和app.defineArgument的id相同，value必须参照格式为{ index: parameterIndex, value: any }，其中index是参数的索引，value其它添加到metadata的值
        Reflect.defineMetadata('__myArg', { index: parameterIndex, value: mystring }, api);
    };
};
let TestController = class TestController {
    customArg(custom_arg) {
        return __awaiter(this, void 0, void 0, function* () {
            return { custom_arg: custom_arg };
        });
    }
};
__decorate([
    __1.app.get('/custom_arg'),
    __param(0, myArg('custom_arg'))
], TestController.prototype, "customArg", null);
TestController = __decorate([
    __1.app.RestfulApi()
], TestController);
