// src/api/axios.ts
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth-store";

declare module "axios" {
    // add a private `_retry` flag to the request config to prevent loops
    export interface AxiosRequestConfig {
        _retry?: boolean;
    }
}

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL as string,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// ---- Request: attach token ----
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            // ensure headers exists; some adapters can have it undefined
            config.headers = config.headers ?? {};
            (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// A simple in-memory flag to avoid multi-redirect storms
let isRedirectingFor401 = false;

// ---- Response: handle expiry/unauthorized ----
axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<any>) => {
        const originalRequest = error.config as AxiosRequestConfig | undefined;
        const status = error.response?.status;
        const url = originalRequest?.url ?? "";

        // Network or CORS errors: just bubble up
        if (!originalRequest) return Promise.reject(error);

        // Don't trigger on login call itself
        const isAuthRoute = /\/auth\/login|\/login/i.test(url);

        // Your backend may return a code/body for token expiry—adjust as needed:
        const code = (error.response?.data as any)?.code || (error.response?.data as any)?.error;
        const isExpired =
            status === 401 ||
            code === "TOKEN_EXPIRED" ||
            code === "UNAUTHORIZED";

        if (isExpired && !originalRequest._retry && !isAuthRoute) {
            originalRequest._retry = true;

            // Clear local auth state
            try {
                const { logout } = useAuthStore.getState();
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                logout?.();
            } catch {
                // ignore
            }

            // set one-shot flag so login can show the special copy
            try {
                sessionStorage.setItem("eastway_expired", "1");
            } catch {
                // ignore
            }

            // Avoid multiple redirects at once
            if (!isRedirectingFor401) {
                isRedirectingFor401 = true;

                // If we're not already there, send user to /reauth first
                try {
                    const current = window.location.pathname;
                    if (!/^\/reauth/i.test(current)) {
                        // Reauth page shows the pre-login splash, then navigates to /login?expired=1
                        window.location.href = "/reauth";
                    }
                } catch {
                    // ignore
                }
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
