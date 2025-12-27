import { AuthService } from '../AuthService';

// Mock dependencies
const mockAuth = {
    signOut: jest.fn(),
};

jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(),
    getApps: jest.fn().mockReturnValue([]),
    getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => mockAuth),
    initializeAuth: jest.fn(() => mockAuth),
    getReactNativePersistence: jest.fn(),
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('../../../utils/Logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('AuthService', () => {
    let service: AuthService;
    const {
        initializeAuth,
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        sendPasswordResetEmail,
        onAuthStateChanged
    } = require('firebase/auth');

    beforeEach(() => {
        // Clear instance for singleton reset
        (AuthService as any).instance = undefined;
        jest.clearAllMocks();
    });

    it('should initialize auth with persistence', () => {
        service = AuthService.getInstance();
        expect(initializeAuth).toHaveBeenCalled();
        expect(service.getAuthInstance()).toBe(mockAuth);
    });

    it('should sign in', async () => {
        service = AuthService.getInstance();
        await service.signIn('test@test.com', 'password');
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@test.com', 'password');
    });

    it('should sign up', async () => {
        service = AuthService.getInstance();
        await service.signUp('test@test.com', 'password');
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@test.com', 'password');
    });

    it('should sign out', async () => {
        service = AuthService.getInstance();
        await service.signOut();
        expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('should reset password', async () => {
        service = AuthService.getInstance();
        await service.resetPassword('test@test.com');
        expect(sendPasswordResetEmail).toHaveBeenCalledWith(mockAuth, 'test@test.com');
    });

    it('should subscribe to auth state changes', () => {
        service = AuthService.getInstance();
        const callback = jest.fn();
        service.onAuthStateChanged(callback);
        expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, callback);
    });

    it('should handle already initialized error', () => {
        // Simulate already initialized error
        (initializeAuth as jest.Mock).mockImplementationOnce(() => {
            const error: any = new Error('Already initialized');
            error.code = 'auth/already-initialized';
            throw error;
        });

        service = AuthService.getInstance();
        // Should catch and use getAuth
        const { getAuth } = require('firebase/auth');
        expect(getAuth).toHaveBeenCalled();
    });

    it('should use existing app if available', () => {
        const { getApps, getApp } = require('firebase/app');
        getApps.mockReturnValue([{ name: 'existing-app' }]);

        service = AuthService.getInstance();
        expect(getApp).toHaveBeenCalled();
        expect(initializeAuth).toHaveBeenCalled();
    });

    it('should handle generic initialization error and fallback', () => {
        (initializeAuth as jest.Mock).mockImplementationOnce(() => {
            throw new Error('Generic Native Persistence Error');
        });

        service = AuthService.getInstance();

        const { getAuth } = require('firebase/auth');
        expect(getAuth).toHaveBeenCalled();
    });

    it('should return same instance on subsequent calls', () => {
        const instance1 = AuthService.getInstance();
        const instance2 = AuthService.getInstance();
        expect(instance1).toBe(instance2);
    });
});
