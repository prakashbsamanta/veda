import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth,
    // @ts-ignore
    getReactNativePersistence,
    onAuthStateChanged,
    User,
    Auth
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../../config/firebaseConfig';
import { logger } from '../../utils/Logger';

export class AuthService {
    private static instance: AuthService;
    private auth: Auth;

    private constructor() {
        let app;
        if (getApps().length === 0) {
            app = initializeApp(firebaseConfig);
        } else {
            app = getApp();
        }

        // Initialize Auth with Persistence
        try {
            this.auth = initializeAuth(app, {
                persistence: getReactNativePersistence(ReactNativeAsyncStorage)
            });
            logger.info("Firebase Auth initialized with persistence");
        } catch (e: any) {
            // If already initialized (e.g. fast refresh), fallback to getAuth
            // initializeAuth throws if auth is already initialized for the app
            if (e.code === 'auth/already-initialized') {
                this.auth = getAuth(app);
                logger.info("Firebase Auth already initialized, used existing instance");
            } else {
                logger.error("Error initializing auth:", e);
                // Fallback to default (memory) if persistence fails
                this.auth = getAuth(app);
            }
        }
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public getAuthInstance() {
        return this.auth;
    }

    public onAuthStateChanged(callback: (user: User | null) => void) {
        return onAuthStateChanged(this.auth, callback);
    }

    public async signOut() {
        return this.auth.signOut();
    }

    public async signIn(email: string, password: string) {
        const { signInWithEmailAndPassword } = require('firebase/auth');
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    public async signUp(email: string, password: string) {
        const { createUserWithEmailAndPassword } = require('firebase/auth');
        return createUserWithEmailAndPassword(this.auth, email, password);
    }

    public async resetPassword(email: string) {
        const { sendPasswordResetEmail } = require('firebase/auth');
        return sendPasswordResetEmail(this.auth, email);
    }
}

export const authService = AuthService.getInstance();
