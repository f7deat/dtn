import { createRequest } from "./request";

export async function apiMyEventList(params: { current?: number; pageSize?: number; } = {}) {
  const response = await createRequest().get("event/my-events", {
    params: {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 100,
    },
  });

  return (response.data?.data ?? []) as API.MyEventItem[];
}

export async function apiMyEventQr(eventId: string) {
  const response = await createRequest().get(`event/my-qr/${eventId}`);
  return (response.data?.data ?? null) as API.EventQrPayload | null;
}