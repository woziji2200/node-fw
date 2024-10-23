import { fw } from "."
/**
 * 忽略url末尾的斜杠
 * @param req 
 * @param res 
 */
export const ignoreEndSlash = async (req: fw.Request, res: fw.Response) => {
    const routePath = req.url?.split("?")
    if (routePath && routePath[0].endsWith("/")) {
        req.url = routePath[0].slice(0, -1) + (routePath[1] ? "?" + routePath[1] : "")
    }
}

/**
 * 配置CORS跨域
 * @param options 配置项
 * @returns 
 */
export const cors = (options?: { headers: string[], methods: string[], origin: string[] }) => {
    return async (req: fw.Request, res: fw.Response) => {
        res.setHeader("access-control-allow-headers", options?.headers?.join(",") || "*")
        res.setHeader("access-control-allow-methods", options?.methods?.join(",") || "GET, POST, PUT, DELETE, OPTIONS")
        res.setHeader("access-control-allow-origin", options?.origin?.join(",") || "*")
        res.setHeader("access-control-max-age", "86400")
        if (req.method?.toLocaleLowerCase() === "options") {
            res.statusCode = 200
            res.end()
            return true
        }
    }
}

export const errorHandler = async (err: fw.InternetError, req: fw.Request, res: fw.Response) => {
    res.statusCode = err.statusCode || 500;
    res.setHeader("Content-Type", "application/json")
    res.end(`{"code": ${err.statusCode || 500}, "msg": "${err.message}"}`);
}