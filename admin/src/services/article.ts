import { request } from "@umijs/max";

export async function apiArticleList(params: any) {
    return request(`article/list`, { params });
}

export async function apiArticleCreate(data: any) {
    return request(`article/create`, {
        method: 'POST',
        data,
    });
}