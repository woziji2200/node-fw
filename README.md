# node-fw

基于Typescript装饰器 stage2.0的一个简单的node http后端框架，支持简单的全局异常处理、中间件等

### 快速开始

```bash
还没上npm呢
```
**重要：在`ts.config`中启用：`"experimentalDecorators": true`**


```ts
// index.ts
import fw from "../lib/index"
import path = require("path");

export const app = new fw()
app.registerRouter(path.join(__dirname, "router"));
app.listen(3000, () => {
    console.log('Server started on port 3000');
})
```
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

### 完整文档
[使用文档](doc/README.md)