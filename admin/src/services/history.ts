import { request } from "@umijs/max";

export async function apiHistoryList(params?: any) {
    return request("log/list", {
        params
    });
}