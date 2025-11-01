import { create } from "zustand";

type UserRole = "admin" | "superadmin";

export interface User {
    phoneNumber: string;
    role: UserRole;
}

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: User | null;

    setTokens: (access: string | null, refresh?: string | null) => void;
    setUser: (user: User | null) => void;

    login: (payload: { access_token: string; refresh_token?: string; user?: User }) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem("access_token") || null,
    refreshToken: localStorage.getItem("refresh_token") || null,
    user: (() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? (JSON.parse(raw) as User) : null;
        } catch {
            return null;
        }
    })(),

    setTokens: (access, refresh) => {
        if (access) {
            localStorage.setItem("access_token", access);
        } else {
            localStorage.removeItem("access_token");
        }

        if (typeof refresh !== "undefined") {
            if (refresh) localStorage.setItem("refresh_token", refresh);
            else localStorage.removeItem("refresh_token");
        }

        set((s) => ({
            token: access,
            refreshToken: typeof refresh === "undefined" ? s.refreshToken : refresh,
        }));
    },

    setUser: (user) => {
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
        set({ user });
    },

    login: ({ access_token, refresh_token, user }) => {
        localStorage.setItem("access_token", access_token);
        if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
        if (user) localStorage.setItem("user", JSON.stringify(user));

        set((s) => ({
            token: access_token,
            refreshToken: refresh_token ?? s.refreshToken,
            user: user ?? s.user,
        }));
    },

    logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        set({ token: null, refreshToken: null, user: null });
    },
}));
