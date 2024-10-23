import path = require("path");
import fw from "../lib/index"
import { utils } from "../lib/index";

// 实例化框架
export let app = new fw();


// 全局异常处理中间件
app.onError(utils.errorHandler);

// 全局前置中间件
app.beforeRequest(utils.ignoreEndSlash)
app.beforeRequest(utils.cors())
app.beforeRequest(async (req, res)=>{
    console.log(`beforeRequest: there is a request on ${req.method} ${req.url}`);
})

// 中间件只拦截/api/user/*的请求
app.beforeRequest('/api/*', async (req, res)=>{
    console.log(`beforeRequestOn '/api/*': there is a request on ${req.method} ${req.url}`);
})

// 注册路由，参数为路由文件所在目录
app.registerRouter(path.join(__dirname));

// 同样支持正则表达式
// app.beforeRequest(/^\/api\/(.*)/, async (req, res)=>{
//     console.log(`beforeRequestOn '/api/*': there is a request on ${req.method} ${req.url}`);
// })


// 启动服务
app.listen(3000, () => {
    console.log('Server started on port 3000');
})