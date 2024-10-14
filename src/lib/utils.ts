import { fw } from "."

export const ignoreEndSlash = async (req: fw.Request, res: fw.Response) => {
    const routePath = req.url?.split("?")
    if(routePath && routePath[0].endsWith("/")) {
        req.url = routePath[0].slice(0, -1) + (routePath[1] ? "?" + routePath[1] : "")
    }
}