import { request } from "@umijs/max";

export async function apiAcademicYearList(params: any) {
    return request("academic-year/list", {
        params,
    });
}

export async function apiAcademicYearCreate(data: any) {
    return request("academic-year", {
        method: "POST",
        data,
    });
}

export async function apiAcademicYearUpdate(data: any) {
    return request("academic-year", {
        method: "PUT",
        data,
    });
}

export async function apiAcademicYearDelete(id: number) {
    return request(`academic-year/${id}`, {
        method: "DELETE",
    });
}

export async function apiAcademicYearOptions(params?: any) {
    return request('academic-year/options', {
        params,
    });
}