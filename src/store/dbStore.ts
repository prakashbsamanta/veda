import { create } from 'zustand';
import { dbService } from '../services/database/DatabaseService';

interface DBState {
    isInitialized: boolean;
    initDatabase: () => Promise<void>;
    error: string | null;
}

export const useDBStore = create<DBState>((set) => ({
    isInitialized: false,
    error: null,
    initDatabase: async () => {
        try {
            await dbService.init();
            set({ isInitialized: true, error: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown DB Error';
            set({ isInitialized: false, error: message });
        }
    },
}));
