import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (
            status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/login")
        ) {
            originalRequest._retry = true;

            const { logout } = useAuthStore.getState();

            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            logout();

            console.warn("Session expired. Please log in again.");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
