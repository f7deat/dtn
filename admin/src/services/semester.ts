import { request } from "@umijs/max";

export async function apiSemesterList(params: any) {
    return request("semester/list", {
        params,
    });
}

export async function apiSemesterCreate(data: any) {
    return request("semester", {
        method: "POST",
        data,
    });
}

export async function apiSemesterUpdate(data: any) {
    return request("semester", {
        method: "PUT",
        data,
    });
}

export async function apiSemesterDelete(id: number) {
    return request(`semester/${id}`, {
        method: "DELETE",
    });
}

export async function apiSemesterOptions(params?: any) {
    return request("semester/options", {
        params,
    });
}