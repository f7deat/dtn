import { request } from "@umijs/max";

export async function apiArticleList(params: any) {
    return request(`article/list`, { params });
}

export async function apiArticleCreate(data: any) {
    return request(`article`, {
        method: 'POST',
        data,
    });
}

export async function apiArticleGet(id?: string) {
    return request(`article/${id}`);
}

export async function apiArticleUpdate(data: any) {
    return request(`article`, {
        method: 'PUT',
        data,
    });
}