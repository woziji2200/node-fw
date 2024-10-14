## 路由参数

### app.param
将会提供url get中的参数
```ts
app.param(options: {
    name: string,                               // 接口中的名称
    required?: boolean,                         // 是否必须，默认为false
    defaultValue?: any,                         // 如果不提供该参数的默认值
    checkFunction?: (value: any) => boolean     // 检测该参数是否有效，将会在接口真正调用前执行
})
```
例如：
```ts
@app.get('/user')
async getUserInfo(
    @app.param({ name: 'id', required: true, chechFunction: value => value >= 0 }) id: string,
) {
    return { id: id, name: 'test' }
}
```
将会解析`/user?id=1`中的1并提供给参数id


### app.body
将会自动解析并提供`application/json`或`application/x-www-form-urlencoded`的Post参数
```ts
app.body(options: {
    name: string,                               // 接口中的名称
    required?: boolean,                         // 是否必须，默认为false
    defaultValue?: any,                         // 如果不提供该参数的默认值
    checkFunction?: (value: any) => boolean     // 检测该参数是否有效，将会在接口真正调用前执行
})
```


### app.urlParam
将会解析url路径中的参数，例如`/api/user/:id`的路由将会解析`/api/user/100`中的100
```ts
app.urlParam(options: {
    name: string,
    checkFunction?: (value: any) => boolean
})
```

### @app.optionsSetter
用来设置statusCode和headers
```ts
app.optionsSetter() optionsSetter: OptionsSetter
```
```ts
OptionsSetter:  {
    setHeaders(headers: {[key: string]: string;}): void;    // 设置一个和一组header，将覆盖之前的所有设置
    pushHeaders(headers: {[key: string]: string; }): void;  // 增加一个或一组header
    setStatusCode(statusCode: number): void;                // 设置HTTP状态码
}
```

例如：
```ts
@app.post('/login')
async login(
    @app.body({ name: 'username', required: true }) username: string,
    @app.body({ name: 'password', required: true }) password: string,
    @app.optionsSetter() optionsSetter: OptionsSetter
) {
    optionsSetter.pushHeaders({ 'Authorization': 'Bearer 123456' });
    return { msg: 'login success' }
}
```

### app.req
将会返回node http中的Request对象

### app.res
将会返回node http中的Response对象

您可以自己调用Response的方法自行处理服务器的响应值，此时只需在接口处理函数中返回undefined即可
```ts
@app.get('/req_res')
async getReqRes(
    @app.req() req: fw.Request,
    @app.res() res: fw.Response,
) {
    console.log('getReqRes:', req.url);
    res.end('自行结束请求');
    return
}
```