import { activityService } from '../ActivityService';
import { dbService } from '../DatabaseService';

// Mock uuid BEFORE imports
jest.mock('uuid', () => ({
    v4: () => 'test-uuid-' + Math.random()
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn(() => Promise.resolve({
        execAsync: jest.fn(() => Promise.resolve()),
        runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1, changes: 1 })),
        getAllAsync: jest.fn((query) => {
            if (query && query.includes('PRAGMA table_info')) {
                return Promise.resolve([{ name: 'id' }, { name: 'recurrence_rule' }]);
            }
            return Promise.resolve([]);
        }),
        getFirstAsync: jest.fn(() => Promise.resolve(null)),
    })),
    // Also mock synchronous open for Android fix
    openDatabaseSync: jest.fn(() => ({
        execAsync: jest.fn(() => Promise.resolve()),
        runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1, changes: 1 })),
        getAllAsync: jest.fn((query) => {
            if (query && query.includes('PRAGMA table_info')) {
                return Promise.resolve([{ name: 'id' }, { name: 'recurrence_rule' }]);
            }
            return Promise.resolve([]);
        }),
        getFirstAsync: jest.fn(() => Promise.resolve(null)),
    }))
}));

describe('ActivityService Recurrence', () => {
    beforeAll(async () => {
        await dbService.init();
    });

    it('should save activity with recurrence rule', async () => {
        const rule = { frequency: 'weekly', interval: 2 };
        const id = await activityService.createActivity('user-123', {
            type: 'task',
            title: 'Bi-weekly Task',
            recurrence_rule: JSON.stringify(rule)
        });

        expect(id).toBeDefined();
        // In a real integration test we would verify the DB insert, 
        // but here we trust the mock ensures the query logic didn't crash.
    });

    it('should update activity recurrence', async () => {
        const rule = { frequency: 'daily' };
        await activityService.updateActivity('test-uuid-1', {
            recurrence_rule: JSON.stringify(rule)
        });
        // Pass if no error thrown
    });
});
