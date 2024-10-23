## 中间件
支持全局异常处理、全局前置路由、全局后置路由三种中间件

### 全局异常处理
当发生异常时（例如缺少required的参数、checkFunction检测不合法等），将会自动调用onError注册的中间件

发生异常后任何后续的逻辑都将不会执行，因此这个中间件中必须手动结束请求。
```ts
app.onError(
    routePath?: string | RegExp,
    handler: (err: fw.InternetError, req: fw.Request, res: fw.Response) => any | Promise<any>
)
```

例：
```ts
app.onError(async (err, req, res)=>{
    res.statusCode = 500;
    console.error(`onError: ${err.message}`);
    if(err.statusCode) res.statusCode = err.statusCode;
    res.end(`${err.message}`);
});
```

### 全局前置路由中间件
```ts
app.beforeRequest(
    routePath?: string | RegExp,
    handler: (req: fw.Request, res: fw.Response) => any | Promise<any>
)
```
当返回值为`true`或者`Promise<true>`或者所有可以被认为是true的值时，将会结束请求。此时结束请求必须要手动返回响应值

### 全局后置路由中间件
```ts
app.afterRequest(
    routePath?: string | RegExp,
    handler: (req: fw.Request, res: fw.Response) => any | Promise<any>
)
```
当返回值为`true`或者`Promise<true>`或者所有可以被认为是true的值时，将会结束请求。此时结束请求必须要手动返回响应值

### 接口中间件
```ts
app.get(
    routePath: string | RegExp,
    beforeRequest?: ((req: fw.Request, res: fw.Response) => any | Promise<any>) | ((req: fw.Request, res: fw.Response) => any | Promise<any>)[]
)
```
这种中间件将会只对这个接口生效

### 路由匹配规则
`routePath`取值可为：

- "*"：将对所有接口生效
- "/api/*"：将对所有符合/api/xxx的接口生效
- RegExp：将使用正则匹配接口