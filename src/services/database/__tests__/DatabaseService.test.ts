import { DatabaseService } from '../DatabaseService';
import * as SQLite from 'expo-sqlite';
import { SCHEMA_QUERIES } from '../schema';

// Mock expo-sqlite
const mockDb = {
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    closeAsync: jest.fn(),
    execSync: jest.fn(),
    runSync: jest.fn(),
    getAllSync: jest.fn(),
    getFirstSync: jest.fn(),
    closeSync: jest.fn()
};

jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn(),
    openDatabaseSync: jest.fn()
}));

// Mock Logger
jest.mock('../../../utils/Logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock schema queries
jest.mock('../schema', () => ({
    SCHEMA_QUERIES: ['CREATE TABLE test;']
}));

describe('DatabaseService', () => {
    let service: DatabaseService;

    beforeEach(() => {
        // Reset singleton
        (DatabaseService as any).instance = undefined;
        jest.clearAllMocks();

        // Reset mockDb implementations
        mockDb.execAsync.mockReset();
        mockDb.runAsync.mockReset();
        mockDb.getAllAsync.mockReset();
        mockDb.getFirstAsync.mockReset();

        (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
        (SQLite.openDatabaseSync as jest.Mock).mockReturnValue(mockDb);
    });

    it('should initialize database and schema', async () => {
        service = DatabaseService.getInstance();
        await service.init();
        const usedSync = (SQLite.openDatabaseSync as jest.Mock).mock.calls.length > 0;
        const usedAsync = (SQLite.openDatabaseAsync as jest.Mock).mock.calls.length > 0;
        expect(usedSync || usedAsync).toBe(true);
        expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE'));
    });

    it('should not re-initialize if already open', async () => {
        service = DatabaseService.getInstance();
        await service.init();
        await service.init();
        const syncCalls = (SQLite.openDatabaseSync as jest.Mock).mock.calls.length;
        const asyncCalls = (SQLite.openDatabaseAsync as jest.Mock).mock.calls.length;
        expect(syncCalls + asyncCalls).toBe(1);
    });

    it('should handle concurrent init calls (forced)', async () => {
        service = DatabaseService.getInstance();
        const mockPromise = Promise.resolve();
        (service as any).initPromise = mockPromise;

        await service.init();

        // Should NOT call openDatabase again
        expect((SQLite.openDatabaseSync as jest.Mock)).not.toHaveBeenCalled();
        expect((SQLite.openDatabaseAsync as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should execute run query (auto-init)', async () => {
        service = DatabaseService.getInstance();
        await service.execute('INSERT INTO test VALUES (?)', [1]);
        expect(mockDb.runAsync).toHaveBeenCalledWith('INSERT INTO test VALUES (?)', [1]);
    });

    it('should execute run query (already initialized)', async () => {
        service = DatabaseService.getInstance();
        await service.init(); // Initialize first
        await service.execute('INSERT INTO test VALUES (?)', [1]);
        expect(mockDb.runAsync).toHaveBeenCalledWith('INSERT INTO test VALUES (?)', [1]);
    });

    it('should execute getAll query (already initialized)', async () => {
        service = DatabaseService.getInstance();
        await service.init();
        const mockResult = [{ id: 1 }];
        mockDb.getAllAsync.mockResolvedValue(mockResult);
        const result = await service.getAll('SELECT *', []);
        expect(result).toBe(mockResult);
    });

    it('should execute getFirst query (already initialized)', async () => {
        service = DatabaseService.getInstance();
        await service.init();
        const mockResult = { id: 1 };
        mockDb.getFirstAsync.mockResolvedValue(mockResult);
        const result = await service.getFirst('SELECT *', []);
        expect(result).toBe(mockResult);
    });

    it('should execute getAll query (auto-init)', async () => {
        service = DatabaseService.getInstance();
        const mockResult = [{ id: 1 }];
        mockDb.getAllAsync.mockResolvedValue(mockResult);
        const result = await service.getAll('SELECT * FROM test');
        expect(result).toBe(mockResult);
    });

    it('should execute getFirst query (auto-init)', async () => {
        service = DatabaseService.getInstance();
        const mockResult = { id: 1 };
        mockDb.getFirstAsync.mockResolvedValue(mockResult);
        const result = await service.getFirst('SELECT * FROM test LIMIT 1');
        expect(result).toBe(mockResult);
    });

    it('should throw if initSchema called without db', async () => {
        service = DatabaseService.getInstance();
        await expect(async () => {
            await (service as any).initSchema();
        }).rejects.toThrow('Database not initialized');
    });

    it('should throw error if getDatabase called before init', () => {
        service = DatabaseService.getInstance();
        expect(() => service.getDatabase()).toThrow("Database not initialized");
    });

    it('should return database instance after init', async () => {
        service = DatabaseService.getInstance();
        await service.init();
        expect(service.getDatabase()).toBe(mockDb);
    });

    it('should handle init failure (DB Open Error)', async () => {
        const error = new Error('DB Error');
        (SQLite.openDatabaseSync as jest.Mock).mockImplementation(() => { throw error; });
        service = DatabaseService.getInstance();
        await expect(service.init()).rejects.toThrow('DB Error');
        expect(() => service.getDatabase()).toThrow("Database not initialized");
    });

    it('should handle schema execution failure', async () => {
        const schemaError = new Error('Schema Error');
        mockDb.execAsync.mockRejectedValue(schemaError);
        service = DatabaseService.getInstance();
        await expect(service.init()).rejects.toThrow('Schema Error');
        const { logger } = require('../../../utils/Logger');
        expect(logger.error).toHaveBeenCalledWith('Error initializing schema:', schemaError);
        expect(logger.error).toHaveBeenCalledWith('Failed to initialize database:', schemaError);
    });

    it('should return same singleton instance', () => {
        const s1 = DatabaseService.getInstance();
        const s2 = DatabaseService.getInstance();
        expect(s1).toBe(s2);
    });
});
