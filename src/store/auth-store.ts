import { create } from "zustand";

type UserRole = 'admin' | 'superadmin'

export interface User {
    phoneNumber: string;
    role: UserRole
}

interface AuthState {
    token: string | null;
    user: User | null;
    setUser: (user: User) => void;
    login: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem("access_token") || null,
    user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) as User : null,

    login: (token) => {
        localStorage.setItem("access_token", token);
        set({ token });
    },

    setUser: (user: User) => {
        localStorage.setItem("user", JSON.stringify(user));
        set({ user });
    },

    logout: () => {
        localStorage.removeItem("access_token");
        set({ token: null });
    },
}));
