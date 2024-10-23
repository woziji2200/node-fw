"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const path = require("path");
const index_1 = __importDefault(require("../lib/index"));
const index_2 = require("../lib/index");
// 实例化框架
exports.app = new index_1.default();
// 全局异常处理中间件
exports.app.onError((err, req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.statusCode = 500;
    console.error(`onError: ${err.message}`);
    if (err.statusCode)
        res.statusCode = err.statusCode;
    res.end(`${err.message}`);
}));
// 全局前置中间件
exports.app.beforeRequest(index_2.utils.ignoreEndSlash);
exports.app.beforeRequest((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`beforeRequest: there is a request on ${req.method} ${req.url}`);
}));
// 中间件只拦截/api/user/*的请求
exports.app.beforeRequest('/api/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`beforeRequestOn '/api/*': there is a request on ${req.method} ${req.url}`);
}));
// 注册路由，参数为路由文件所在目录
exports.app.registerRouter(path.join(__dirname));
// 同样支持正则表达式
// app.beforeRequest(/^\/api\/(.*)/, async (req, res)=>{
//     console.log(`beforeRequestOn '/api/*': there is a request on ${req.method} ${req.url}`);
// })
// 启动服务
exports.app.listen(3000, () => {
    console.log('Server started on port 3000');
});
