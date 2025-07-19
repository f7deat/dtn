import request from "./request";

export async function apiArticleList(params: { current: number; pageSize: number}) {
    return request.get('article/list', { params });
}