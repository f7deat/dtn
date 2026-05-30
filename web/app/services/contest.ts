import { createRequest } from "./request";

export async function apiContestList(params: { current?: number; pageSize?: number; } = {}) {
  const response = await createRequest().get("contest/list", {
    params: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 100,
    },
  });

  return (response.data?.data ?? []) as API.ContestListItem[];
}

export async function apiContestGet(id: string) {
  const response = await createRequest().get(`contest/${id}`);
  return (response.data?.data ?? null) as API.ContestListItem | null;
}

export async function apiContestMySubmissions(id: string) {
  const response = await createRequest().get(`contest/${id}/my-submissions`);
  return (response.data?.data ?? []) as API.ContestSubmissionItem[];
}

export async function apiContestSubmit(id: string, file: File, note?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (note) {
    formData.append("note", note);
  }

  const response = await createRequest().post(`contest/${id}/submit`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}