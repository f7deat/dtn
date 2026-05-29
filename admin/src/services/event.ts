import { request } from "@umijs/max";

export async function apiEventList(params: any) {
    return request("event/list", { params });
}

export async function apiEventGet(eventId: string) {
    return request(`event/${eventId}`);
}

export async function apiEventCreate(data: any) {
    return request("event", {
        method: "POST",
        data
    });
}

export async function apiEventUpdate(data: any) {
    return request("event", {
        method: "PUT",
        data
    });
}

export async function apiEventUserList(params: any) {
    return request("event/users", { params });
}

export async function apiEventAddUser(data: { eventId: string; userName: string; }) {
    return request("event/add-user", {
        method: "POST",
        data
    });
}

export async function apiEventRemoveUser(data: { eventId: string; userId: string; }) {
    return request("event/remove-user", {
        method: "POST",
        data
    });
}

export async function apiEventGenerateQr(data: { eventId: string; userId: string; }) {
    return request("event/qr", {
        method: "POST",
        data
    });
}

export async function apiEventCheckIn(data: { eventId?: string; qrCode: string; action?: "check-in" | "check-out"; attendanceDate?: string; }) {
    return request("event/scan", {
        method: "POST",
        data
    });
}

export async function apiEventExport(eventId: string, attendanceDate?: string) {
    return request(`event/check-in/export/${eventId}`, {
        method: "GET",
        params: attendanceDate ? { attendanceDate } : undefined,
        responseType: "blob"
    });
}

export async function apiEventImport(eventId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return request(`event/check-in/import/${eventId}`, {
        method: "POST",
        data: formData,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
}

export async function apiEventImportTemplate(eventId: string) {
    return request(`event/check-in/import-template/${eventId}`, {
        method: "GET",
        responseType: "blob"
    });
}

export async function apiEventDelete(eventId: string) {
    return request(`event/${eventId}`, {
        method: "DELETE"
    });
}