import { create } from "zustand";

interface AuthState {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem("access_token") || null,

    login: (token) => {
        localStorage.setItem("access_token", token);
        set({ token });
    },

    logout: () => {
        localStorage.removeItem("access_token");
        set({ token: null });
    },
}));
