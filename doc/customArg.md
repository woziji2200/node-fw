## 自定义参数装饰器

除了app.param等参数装饰器，您也可以自定义自己的参数装饰器

> 这里遵循typescript stage2.0的装饰器规则，stage3.0暂不支持参数装饰器

### 安装元数据反射库
> 目前这是一个实验性的特性，需要第三方库支持
```bash
npm install reflect-metadata
```
### 编写装饰器函数
```ts
// 参数装饰器函数
const myArg = (mystring: string) => {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        // 为目标函数的元数据添加metadata
        const api = (target as any)[propertyKey];
        // 添加的metadata的key和app.defineArgument的id相同，value必须参照格式为{ index: parameterIndex, value: any }，其中index是参数的索引，value其它添加到metadata的值
        Reflect.defineMetadata('__myArg', { index: parameterIndex, value: mystring }, api);
    }
}
```

### 注册自定义参数
```ts
// 可以自定义参数装饰器
app.defineArgument({
    // id唯一标识了参数装饰器，必须和app.defineArgument的id相同
    id: '__myArg', 
    handler(req, res, metadata) {
        // 抛出异常会直接中断请求，被全局异常处理中间件捕获
        // throw new fw.InternetError('自定义参数装饰器', 233)
        // metadata将会与装饰器函数的{ index: parameterIndex, value: any }相同
        return req.url + ": " + metadata.value
    }
})
```


### 使用自定义参数

```ts
@app.RestfulApi()
class TestController {
    @app.get('/custom_arg')
    async customArg(
        @myArg('custom_arg') custom_arg: string,
    ) {
        return { custom_arg: custom_arg }
    }
}
```

> 自定义的参数目前同一个的装饰器只能使用一次
例如以下的custom_arg2、custom_arg3都会是undefined
```ts
@app.RestfulApi()
class TestController {
    @app.get('/custom_arg')
    async customArg(
        @myArg('custom_arg') custom_arg: string,
        @myArg('custom_arg') custom_arg2: string,
        @myArg('custom_arg') custom_arg3: string,
    ) {
        return { custom_arg: custom_arg }
    }
}
```