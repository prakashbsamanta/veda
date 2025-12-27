import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';
import { authService } from '../../services/auth/AuthService';

// Mock AuthService
jest.mock('../../services/auth/AuthService', () => ({
    authService: {
        onAuthStateChanged: jest.fn()
    }
}));

describe('authStore', () => {
    beforeEach(() => {
        const initialState = useAuthStore.getState();
        useAuthStore.setState({ user: null, loading: true });
        jest.clearAllMocks();
    });

    it('should have default state', () => {
        const { result } = renderHook(() => useAuthStore());
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(true);
    });

    it('should set user', () => {
        const { result } = renderHook(() => useAuthStore());
        const mockUser = { uid: '123', email: 'test@test.com' } as any;

        act(() => {
            result.current.setUser(mockUser);
        });

        expect(result.current.user).toEqual(mockUser);
    });

    it('should set loading', () => {
        const { result } = renderHook(() => useAuthStore());

        act(() => {
            result.current.setLoading(false);
        });

        expect(result.current.loading).toBe(false);
    });

    it('should init auth subscription', () => {
        const { result } = renderHook(() => useAuthStore());

        // Mock the logic inside onAuthStateChanged to simulate a callback
        (authService.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
            callback({ uid: 'user-from-service' }); // Trigger immediately
        });

        act(() => {
            result.current.initAuth();
        });

        expect(authService.onAuthStateChanged).toHaveBeenCalled();
        expect(result.current.user).toEqual({ uid: 'user-from-service' });
        expect(result.current.loading).toBe(false);
    });
});
