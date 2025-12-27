import { act } from '@testing-library/react-native'; // act might be needed for state updates
import { useDBStore } from '../dbStore';
import { dbService } from '../../services/database/DatabaseService';

// Mock DatabaseService
jest.mock('../../services/database/DatabaseService', () => ({
    dbService: {
        init: jest.fn(),
    }
}));

describe('dbStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset store state
        useDBStore.setState({
            isInitialized: false,
            error: null
        });
    });

    it('should have default state', () => {
        const state = useDBStore.getState();
        expect(state.isInitialized).toBe(false);
        expect(state.error).toBeNull();
    });

    it('should initialize database successfully', async () => {
        (dbService.init as jest.Mock).mockResolvedValue(undefined);

        await useDBStore.getState().initDatabase();

        const state = useDBStore.getState();
        expect(dbService.init).toHaveBeenCalled();
        expect(state.isInitialized).toBe(true);
        expect(state.error).toBeNull();
    });

    it('should handle initialization error', async () => {
        const errorMsg = 'DB Init Failed';
        (dbService.init as jest.Mock).mockRejectedValue(new Error(errorMsg));

        await useDBStore.getState().initDatabase();

        const state = useDBStore.getState();
        expect(dbService.init).toHaveBeenCalled();
        expect(state.isInitialized).toBe(false);
        expect(state.error).toBe(errorMsg);
    });

    it('should handle unknown error', async () => {
        (dbService.init as jest.Mock).mockRejectedValue('Unknown Error String');

        await useDBStore.getState().initDatabase();

        const state = useDBStore.getState();
        expect(state.error).toBe('Unknown DB Error');
    });
});
