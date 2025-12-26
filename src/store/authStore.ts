import { create } from 'zustand';
import { User } from 'firebase/auth';
import { authService } from '../services/auth/AuthService';

interface AuthState {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    initAuth: () => {
        authService.onAuthStateChanged((user: User | null) => {
            set({ user, loading: false });
        });
    }
}));
