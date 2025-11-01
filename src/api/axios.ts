// src/api/axios.ts
import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth-store";

declare module "axios" {
    export interface AxiosRequestConfig {
        _retry?: boolean;
    }
}

// ---- Base URLs -------------------------------------------------------------
const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

// ---- Main instance (has interceptors) -------------------------------------
const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

// ---- Bare instance (no interceptors) for refresh calls --------------------
const bareAxios: AxiosInstance = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

// ---- Token helpers ---------------------------------------------------------
const getAccessToken = () => localStorage.getItem("access_token");
const getRefreshToken = () => localStorage.getItem("refresh_token");

const persistTokens = (access: string, refresh?: string) => {
    localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
    try {
        const st = useAuthStore.getState() as any;
        if (typeof st?.setTokens === "function") st.setTokens(access, refresh);
    } catch { }
};

const clearAuth = () => {
    try {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        const { logout } = useAuthStore.getState();
        logout?.();
    } catch { }
};

// ---- Attach bearer on requests --------------------------------------------
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers = config.headers ?? {};
            (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ---- Single-flight refresh -------------------------------------------------
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;

    const rt = getRefreshToken();
    if (!rt) return Promise.reject(new Error("NO_REFRESH_TOKEN"));

    refreshPromise = (async () => {
        try {
            // Use baseURL + relative path; or switch to the REFRESH_URL constant above.
            const { data } = await bareAxios.post("/auth/refresh", { refresh_token: rt });
            // If your server sits at root with no /api, set VITE_API_BASE_URL accordingly.
            const newAccess = data?.access_token as string | undefined;
            const newRefresh = data?.refresh_token as string | undefined;
            if (!newAccess) throw new Error("MALFORMED_REFRESH_RESPONSE");

            persistTokens(newAccess, newRefresh);
            return newAccess;
        } finally {
            // allow subsequent refresh attempts
            setTimeout(() => (refreshPromise = null), 0);
        }
    })();

    return refreshPromise;
}

// ---- Handle 401s: refresh then replay -------------------------------------
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<any>) => {
        const originalRequest = error.config as AxiosRequestConfig | undefined;
        if (!originalRequest) return Promise.reject(error);

        const status = error.response?.status;
        const url = originalRequest.url ?? "";

        const isAuthRoute = /\/auth\/(login|refresh)|\/login/i.test(url);
        if (status !== 401 || isAuthRoute || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            const newAccess = await refreshAccessToken();

            originalRequest.headers = originalRequest.headers ?? {};
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;

            return axiosInstance(originalRequest);
        } catch (refreshErr) {
            clearAuth();
            try {
                sessionStorage.setItem("eastway_expired", "1");
            } catch { }
            try {
                const current = window.location.pathname;
                if (!/^\/(reauth|login)/i.test(current)) {
                    window.location.href = "/reauth";
                }
            } catch { }
            return Promise.reject(refreshErr);
        }
    }
);

export default axiosInstance;
