import { request } from "@umijs/max";

export async function apiCategoryList(params: any) {
    return request('category/list', {
        params
    });
}

export async function apiCategoryCreate(data: any) {
    return request('category', {
        method: 'POST',
        data
    });
}

export async function apiCategoryUpdate(data: any) {
    return request(`category`, {
        method: 'PUT',
        data
    });
}

export async function apiCategoryDelete(id: number) {
    return request(`category/${id}`, {
        method: 'DELETE'
    });
}