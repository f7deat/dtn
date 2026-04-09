import axios, { type InternalAxiosRequestConfig } from "axios";
import { AUTH_COOKIE_NAME } from "./auth";

export const API_BASE_URL = "https://api.dtn.dhhp.edu.vn";
export const IDENTITY_BASE_URL = "https://identity.dhhp.edu.vn";

export function createRequest(baseURL: string = API_BASE_URL) {
  const instance = axios.create({
    baseURL,
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (typeof window === "undefined") {
        return config;
      }
      const token = localStorage.getItem(AUTH_COOKIE_NAME);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: unknown) => Promise.reject(error)
  );

  return instance;
}

const request = createRequest();

export default request;