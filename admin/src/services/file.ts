import { request } from "@umijs/max";

export async function apiUploadFile(data: FormData) {
    return request('file/upload', {
        method: 'POST',
        data,
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
}