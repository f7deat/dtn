import { request } from "@umijs/max";

function unwrapData<T>(response: { data?: T } | T): T {
    if (response && typeof response === "object" && "data" in (response as { data?: T })) {
        return (response as { data?: T }).data as T;
    }

    return response as T;
}

export async function apiContestList(params: any) {
    return request("contest/list", { params });
}

export async function apiContestGet(id: string) {
    const response = await request(`contest/${id}`);
    return unwrapData(response);
}

export async function apiContestCreate(data: any) {
    return request("contest", {
        method: "POST",
        data,
    });
}

export async function apiContestUpdate(data: any) {
    return request("contest", {
        method: "PUT",
        data,
    });
}

export async function apiContestDelete(id: string) {
    return request(`contest/${id}`, {
        method: "DELETE",
    });
}

export async function apiContestSubmissionList(contestId: string, params: any) {
    return request(`contest/${contestId}/submissions`, { params });
}

export async function apiContestUpdateSubmissionStatus(data: {
    submissionId: string;
    status: 0 | 1 | 2;
    adminNote?: string;
}) {
    return request("contest/submission-status", {
        method: "PUT",
        data,
    });
}

export async function apiContestDeleteSubmission(submissionId: string) {
    return request(`contest/submissions/${submissionId}`, {
        method: "DELETE",
    });
}

export async function apiContestExportSubmissions(contestId: string) {
    return request(`contest/${contestId}/submissions/export`, {
        method: "GET",
        responseType: "blob",
    });
}