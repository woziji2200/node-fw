import { OptionsSetter } from '../../lib/core';
import * as fw from '../../lib/core';
export declare class test {
    test(): string;
    test_json(): {
        message: string;
    };
    test_error(): {
        message: string;
    };
}
export declare class ApiController {
    getUserInfo(id: string): Promise<{
        id: string;
        name: string;
    }>;
    getUserInfoByUrlParams(id: string, name: string): Promise<{
        id: string;
        name: string;
    }>;
    login(username: string, password: string, optionsSetter: OptionsSetter): Promise<{
        msg: string;
    }>;
    isUserId1(id: string): Promise<{
        id: string;
        isUserId1: boolean;
    }>;
    getNews(id: number): Promise<{
        id: number;
        title: string;
        content: string;
    }>;
    getReqRes(req: fw.Request, res: fw.Response): Promise<void>;
}
