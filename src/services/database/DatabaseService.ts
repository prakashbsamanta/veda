import * as SQLite from 'expo-sqlite';
import { SCHEMA_QUERIES } from './schema';
import { logger } from '../../utils/Logger';

export class DatabaseService {
    private static instance: DatabaseService;
    private db: SQLite.SQLiteDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    private constructor() { }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async init(): Promise<void> {
        if (this.db) return;

        // Prevent race conditions during initialization
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                this.db = SQLite.openDatabaseSync('veda.db');
                await this.initSchema();
                logger.info('Database initialized successfully');
            } catch (error) {
                logger.error('Failed to initialize database:', error);
                this.db = null; // Ensure we don't end up with a half-baked state
                throw error;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    private async initSchema(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            // Execute schema queries sequentially
            for (const query of SCHEMA_QUERIES) {
                await this.db.execAsync(query);
            }
        } catch (error) {
            logger.error('Error initializing schema:', error);
            throw error;
        }
    }

    public getDatabase(): SQLite.SQLiteDatabase {
        if (!this.db) {
            throw new Error("Database not initialized. Call init() first.");
        }
        return this.db;
    }

    // Helper for executing queries (basic wrapper)
    public async execute(query: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
        if (!this.db) await this.init();
        return await this.db!.runAsync(query, params);
    }

    public async getAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
        if (!this.db) await this.init();
        return await this.db!.getAllAsync(query, params);
    }

    public async getFirst<T = any>(query: string, params: any[] = []): Promise<T | null> {
        if (!this.db) await this.init();
        return await this.db!.getFirstAsync(query, params);
    }
}

export const dbService = DatabaseService.getInstance();
