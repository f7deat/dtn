import { redirect } from "next/navigation";
import { createRequest } from "./request";

export const AUTH_COOKIE_NAME = "thp_token";

export async function getCurrentUser(): Promise<API.CurrentUser | null> {
  try {
    const response = await createRequest().get("user");
    return response.data?.data as API.CurrentUser;
  } catch {
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=%2Fprofile");
  }
  return user;
}

export async function apiLogin(username: string, password: string) {
  return createRequest().post("student/login", { username, password });
}