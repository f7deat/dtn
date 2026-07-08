import request from "./request";

export async function apiArticleList(params: { current: number; pageSize: number}) {
    return request.get('article/list', { 
        params: {
            ...params,
            published: true
        }
     });
}

export async function apiArticleGetBySlug(normalizedName: string) {
    return request.get(`article/slug/${encodeURIComponent(normalizedName)}`);
}