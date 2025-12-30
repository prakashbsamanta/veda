import { create } from 'zustand';
import { User } from 'firebase/auth';
import { authService } from '../services/auth/AuthService';

interface AuthState {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAdmin: true, // Hardcoded as requested: "make this current user as admin user"
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    initAuth: () => {
        authService.onAuthStateChanged((user: User | null) => {
            set({ user, loading: false });
        });
    }
}));

