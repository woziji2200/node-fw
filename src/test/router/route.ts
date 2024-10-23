import { app } from '..';
import { OptionsSetter } from '../../lib/core';
import * as fw from '../../lib/core';

// every controller must be decorated by @app.RestfulApi()
// 所有的控制器都必须使用@app.RestfulApi()装饰
@app.RestfulApi()
export class test {

    // every method must be decorated by @app.get()
    // 每个方法都必须使用@app.get()装饰
    @app.get('/test')
    test() {
        // you just need to return a string or a object
        // 只需要返回一个字符串或对象
        return "You can see this message, because you have visited /test";
    }

    @app.get('/test_json')
    test_json() {
        // the return value will be converted to json
        // 返回值是object的将被转换为json
        return { message: "You can see this message, because you have visited /test_json" }
    }

    // you can set the before middleware by passing a function or an array of functions to @app.get()
    // 通过传递一个函数或函数数组给@app.get()，可以设置请求之前的中间件
    @app.get('/test_before', (req, res) => { console.log('test_before:', req.url); })
    test_error() {
        return { message: "You can see this message, because you have visited /test_error" }
    }
}

// you can set the base path of the controller by passing a string to @app.RestfulApi()
// 通过传递一个字符串给@app.RestfulApi()，可以设置控制器的base path
@app.RestfulApi('/api')
export class ApiController {

    @app.get('/user')
    async getUserInfo(
        // params must be decorated by @app.param()
        // 参数必须使用@app.param()装饰
        @app.param({ name: 'id', required: true }) id: string,
    ) {
        return { id: id, name: 'test' }
    }


    // url params
    // 路径参数
    @app.get('/user/:id/:name')
    async getUserInfoByUrlParams(
        @app.urlParam({ name: 'id' }) id: string,
        @app.urlParam({ name: 'name' }) name: string,
    ) {
        return { id: id, name: name }
    }


    @app.post('/login')
    async login(
        @app.body({ name: 'username', required: true }) username: string,
        @app.body({ name: 'password', required: true }) password: string,
        // you can get the OptionsSetter to set headers or status code
        // 你可以获取OptionsSetter来设置headers或HTTP状态码
        @app.optionsSetter() optionsSetter: OptionsSetter
    ) {
        optionsSetter.pushHeaders({ 'Authorization': 'Bearer 123456' });
        return { msg: 'login success' }
    }

    @app.get('/isUserId1')
    async isUserId1(
        // the checkFunction will be called before the method to check the value
        // checkFunction会在方法之前调用来检查参数值
        @app.param({ name: 'id', checkFunction: (value) => { return value == '1' }, }) id: string,
    ) {
        return { id: id, isUserId1: id == '1' }
    }

    @app.get('/news')
    async getNews(
        // you can set the default value of the param
        // 你可以设置参数的默认值
        @app.param({ name: 'id', defaultValue: 1 }) id: number,
    ) {
        return { id: id, title: 'news title', content: 'news content' }
    }

    @app.get('/req_res')
    async getReqRes(
        // you can set the default value of the param
        // 你可以设置参数的默认值
        @app.req() req: fw.Request,
        @app.res() res: fw.Response,
    ) {

        console.log('getReqRes:', req.url);
        res.end('手动结束请求');
        return
    }

    @app.delete('/delete')
    async delete(
        @app.param({ name: 'id', required: true }) id: string,
        @app.body({ name: 'username', required: true }) username: string,
    ) {
        return { id, username }
    }

    @app.put('/put')
    async put(
        @app.param({ name: 'id', required: true }) id: string,
        @app.body({ name: 'username', required: true }) username: string,
    ) {
        return { id, username }
    }
}


// 可以自定义参数装饰器
app.defineArgument({
    // id唯一标识了参数装饰器
    id: '__myArg', 
    handler(req, res, metadata) {

        // 抛出异常会直接中断请求，被全局异常处理中间件捕获
        // throw new fw.InternetError('自定义参数装饰器', 233)
        return req.url + ": " + metadata.value
    }
})
// 参数装饰器函数
const myArg = (mystring: string) => {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        // 为目标函数的元数据添加metadata
        const api = (target as any)[propertyKey];
        // 添加的metadata的key和app.defineArgument的id相同，value必须参照格式为{ index: parameterIndex, value: any }，其中index是参数的索引，value其它添加到metadata的值
        Reflect.defineMetadata('__myArg', { index: parameterIndex, value: mystring }, api);
    }
}

@app.RestfulApi()
class TestController {
    @app.get('/custom_arg')
    async customArg(
        @myArg('custom_arg') custom_arg: string,
    ) {
        return { custom_arg: custom_arg }
    }
}
