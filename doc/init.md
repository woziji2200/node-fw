## 初始化

按照一般的框架使用顺序，我们需要：

### 导入并实例化框架
```ts
// index.ts
import fw from "../lib/index"
import path = require("path");
export const app = new fw()
```

### 加载中间件
```ts
// 全局异常处理中间件
app.onError(async (err, req, res)=>{
    console.error(`onError: ${err.message}`);
    if(err.statusCode) res.statusCode = err.statusCode;
    else res.statusCode = 500;
    res.end(`${err.message}`);
});

// 全局前置中间件
app.beforeRequest(async (req, res)=>{
    console.log(`beforeRequest: there is a request on ${req.method} ${req.url}`);
})
```

### 注册路由接口
您可以使用内置的`registerRouter(routerDir: string)`方法直接注册一整个文件夹的方法进行注册，也可以手动`require(module)`单个文件
```ts
app.registerRouter(path.join(__dirname, "router"));
```
或
```ts
require('.\\router\\router.ts')
```

### 编写路由处理函数
```ts
// .\router\router.ts
import { app } from "../index"

@app.RestfulApi()
export class test {

    @app.get('/user')
    async getUserInfo(@app.param({ name: 'id', required: true }) id: string) {
        return { id: id, name: 'test' }
    }
    
}
```

### 开始监听端口！
```ts
app.listen(3000, () => {
    console.log('Server started on port 3000');
})
```
此时在浏览器打开 http://localhost:3000/user?id=1 就可以看到服务器正确的相应了请求