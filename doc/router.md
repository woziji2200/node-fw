## 路由注册

对于每一个接口，必须放在一个class中，并且使用`@app.RestfulApi()`进行装饰，例如
```ts
@app.RestfulApi()
export class test {
    // 各种接口    
}
```

### 路由匹配方式
```ts
@app.RestfulApi()
export class test {
    @app.get('/user')
    async getUserInfo(@app.param({ name: 'id', required: true }) id: string) {
        return { id: id, name: 'test' }
    }
}
```
将匹配`/user`


```ts
@app.RestfulApi('/api')
export class test {
    @app.get('/user')
    async getUserInfo(@app.param({ name: 'id', required: true }) id: string) {
        return { id: id, name: 'test' }
    }
}
```
会把`app.RestApi`的参数和`app.get`的参数拼接，例如如上将匹配`/api/user`


```ts
@app.RestfulApi('/user')
export class test {
    @app.get()
    async getUserInfo(@app.param({ name: 'id', required: true }) id: string) {
        return { id: id, name: 'test' }
    }

    @app.post()
    async getUserInfo(@app.body({ name: 'id', required: true }) id: string) {
        return { id: id, name: 'test' }
    }
}
```
将匹配`GET /user`和`POST /user`


```ts
@app.RestfulApi()
export class test {
    @app.get(/user\/(.*)/)
    async getUserInfo(@app.param({ name: 'id', required: true }) id: string) {
        return { id: id, name: 'test' }
    }
}
```
将匹配正则表达式`/user\/(.*)`，使用正则表达式时类修饰器`@app.RestfulApi`的参数将无效，因为无法拼接正则表达式

```ts
@app.RestfulApi()
export class test {
    @app.get("/news/*")
    async getUserInfo(@app.param({ name: 'id', required: true }) id: string) {
        return { id: id, name: 'test' }
    }
}
```
将匹配例如`/news/abc`类似的所有路径


```ts
@app.RestfulApi()
export class test {
    @app.get("/news/:id")
    async getUserInfo(@app.urlParam({ name: 'id', required: true }) id: string) {
        return { id: id, name: 'test' }
    }
}
```
将匹配例如`/news/abc`类似的所有路径，并把参数传递到`id`中

### 路由中间件
```ts
@app.RestfulApi()
export class test {
    @app.get("/user", (req, res) => { console.log("before request") })
    async getUserInfo(@app.param({ name: 'id', required: true }) id: string) {
        return { id: id, name: 'test' }
    }
}
```
可以使用第二个参数为路由添加中间件，该中间件将只对这一个接口生效


### 路由返回值
如果返回一个string类型的参数，将会自动转换为`Content-Type: text/plain;charset=utf-8`并发送到客户端

如果返回任意一个object，将自动调用`JSON.stringify()`并转换为`Content-Type: application/json;charset=utf-8`并发送到客户端

如果返回undefined，将什么也不做，此时将认为函数内部已经获取了Response对象，已经自己处理好了返回值