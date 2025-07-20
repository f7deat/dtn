import { request } from "@umijs/max";

export async function apiStudentList(params: any) {
    return request(`student/list`, { params });
}