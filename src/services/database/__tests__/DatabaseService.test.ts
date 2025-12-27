import { DatabaseService } from '../DatabaseService';
import * as SQLite from 'expo-sqlite';
import { SCHEMA_QUERIES } from '../schema';

// Mock expo-sqlite
const mockDb = {
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    closeAsync: jest.fn()
};

jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn()
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
    });

    it('should initialize database and schema', async () => {
        service = DatabaseService.getInstance();
        await service.init();

        expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('veda.db');
        expect(mockDb.execAsync).toHaveBeenCalledWith(SCHEMA_QUERIES[0]);
    });

    it('should not re-initialize if already open', async () => {
        service = DatabaseService.getInstance();
        await service.init();
        await service.init();

        expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });

    it('should execute run query', async () => {
        service = DatabaseService.getInstance();
        await service.execute('INSERT INTO test VALUES (?)', [1]);

        // Should auto-init
        expect(SQLite.openDatabaseAsync).toHaveBeenCalled();
        expect(mockDb.runAsync).toHaveBeenCalledWith('INSERT INTO test VALUES (?)', [1]);
    });

    it('should execute getAll query', async () => {
        service = DatabaseService.getInstance();
        const mockResult = [{ id: 1 }];
        mockDb.getAllAsync.mockResolvedValue(mockResult);

        const result = await service.getAll('SELECT * FROM test');
        expect(result).toBe(mockResult);
        expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM test', []);
    });

    it('should execute getFirst query', async () => {
        service = DatabaseService.getInstance();
        const mockResult = { id: 1 };
        mockDb.getFirstAsync.mockResolvedValue(mockResult);

        const result = await service.getFirst('SELECT * FROM test LIMIT 1');
        expect(result).toBe(mockResult);
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

    it('should handle init failure', async () => {
        const error = new Error('DB Error');
        (SQLite.openDatabaseAsync as jest.Mock).mockRejectedValue(error);
        service = DatabaseService.getInstance();

        await expect(service.init()).rejects.toThrow('DB Error');
    });

    it('should handle schema definition error', async () => {
        mockDb.execAsync.mockRejectedValue(new Error('Schema Error'));
        service = DatabaseService.getInstance();

        await expect(service.init()).rejects.toThrow('Schema Error');
    });

    it('should return same singleton instance', () => {
        const s1 = DatabaseService.getInstance();
        const s2 = DatabaseService.getInstance();
        expect(s1).toBe(s2);
    });

    it('should execute getAll query without re-init if already initialized', async () => {
        service = DatabaseService.getInstance();
        await service.init();
        (SQLite.openDatabaseAsync as jest.Mock).mockClear(); // Reset calls

        const mockResult = [{ id: 1 }];
        mockDb.getAllAsync.mockResolvedValue(mockResult);

        await service.getAll('SELECT * FROM test');

        expect(SQLite.openDatabaseAsync).not.toHaveBeenCalled();
        expect(mockDb.getAllAsync).toHaveBeenCalled();
    });

    it('should execute run query without re-init if already initialized', async () => {
        service = DatabaseService.getInstance();
        await service.init();
        (SQLite.openDatabaseAsync as jest.Mock).mockClear();

        await service.execute('INSERT INTO test VALUES (?)', [1]);

        expect(SQLite.openDatabaseAsync).not.toHaveBeenCalled();
        expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it('should execute getFirst query without re-init if already initialized', async () => {
        service = DatabaseService.getInstance();
        await service.init();
        (SQLite.openDatabaseAsync as jest.Mock).mockClear();

        const mockResult = { id: 1 };
        mockDb.getFirstAsync.mockResolvedValue(mockResult);

        await service.getFirst('SELECT * FROM test LIMIT 1');

        expect(SQLite.openDatabaseAsync).not.toHaveBeenCalled();
        expect(mockDb.getFirstAsync).toHaveBeenCalled();
    });
});
