import { request } from "@umijs/max";

export async function apiAcademicYearOptions(params?: any) {
    return request('academic-year/options', {
        params,
    });
}