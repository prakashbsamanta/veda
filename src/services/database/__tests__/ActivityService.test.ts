import { ActivityService } from '../ActivityService';
import { dbService } from '../DatabaseService';

// Mock DatabaseService
jest.mock('../DatabaseService', () => ({
    dbService: {
        execute: jest.fn(),
        getAll: jest.fn(),
    }
}));

// Mock Logger
jest.mock('../../../utils/Logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid')
}));

describe('ActivityService', () => {
    let service: ActivityService;

    beforeEach(() => {
        // Reset singleton
        (ActivityService as any).instance = undefined;
        jest.clearAllMocks();
    });

    it('should create a note activity', async () => {
        service = ActivityService.getInstance();
        const data = {
            type: 'note' as const,
            title: 'Test Note',
            description: 'Desc',
            category: 'Personal'
        };

        const id = await service.createActivity('user-1', data);

        expect(id).toBe('mock-uuid');
        // Check activity insert
        expect(dbService.execute).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO activities'),
            expect.arrayContaining(['mock-uuid', 'user-1', 'note', 'Test Note', 'Desc', 'Personal'])
        );
        // Check no expense insert
        expect(dbService.execute).toHaveBeenCalledTimes(1);
    });

    it('should create an expense activity', async () => {
        service = ActivityService.getInstance();
        const data = {
            type: 'expense' as const,
            title: 'Lunch',
            amount: 100,
            currency: 'USD'
        };

        const id = await service.createActivity('user-1', data);

        expect(id).toBe('mock-uuid');
        // Check activity insert
        expect(dbService.execute).toHaveBeenNthCalledWith(1,
            expect.stringContaining('INSERT INTO activities'),
            expect.any(Array)
        );
        // Check expense insert
        expect(dbService.execute).toHaveBeenNthCalledWith(2,
            expect.stringContaining('INSERT INTO expenses'),
            expect.arrayContaining(['mock-uuid', 'mock-uuid', 100, 'USD'])
        );
    });

    it('should create an expense activity with default currency', async () => {
        service = ActivityService.getInstance();
        const data = {
            type: 'expense' as const,
            title: 'Lunch',
            amount: 100
            // currency undefined
        };

        const id = await service.createActivity('user-1', data);

        expect(dbService.execute).toHaveBeenNthCalledWith(2,
            expect.stringContaining('INSERT INTO expenses'),
            expect.arrayContaining(['mock-uuid', 'mock-uuid', 100, 'INR'])
        );
    });

    it('should get recent activities', async () => {
        service = ActivityService.getInstance();
        const mockActivities = [{ id: '1', title: 'Test' }];
        (dbService.getAll as jest.Mock).mockResolvedValue(mockActivities);

        const result = await service.getRecentActivities('user-1', 10);

        expect(result).toBe(mockActivities);
        expect(dbService.getAll).toHaveBeenCalledWith(
            expect.stringContaining('SELECT'),
            ['user-1', 10]
        );
    });

    it('should handle error when fetching activities', async () => {
        service = ActivityService.getInstance();
        (dbService.getAll as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const result = await service.getRecentActivities('user-1');
        expect(result).toEqual([]); // Should return empty array on log error
    });

    it('should delete activity', async () => {
        service = ActivityService.getInstance();
        await service.deleteActivity('act-1');

        expect(dbService.execute).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE activities SET is_deleted = 1'),
            ['act-1']
        );
    });

    it('should handle error during creation', async () => {
        service = ActivityService.getInstance();
        (dbService.execute as jest.Mock).mockRejectedValue(new Error('Insert Failed'));

        await expect(service.createActivity('user-1', { type: 'note', title: 'T' }))
            .rejects.toThrow('Insert Failed');
    });

    it('should handle error during deletion', async () => {
        service = ActivityService.getInstance();
        (dbService.execute as jest.Mock).mockRejectedValue(new Error('Delete Failed'));

        await expect(service.deleteActivity('act-1')).rejects.toThrow('Delete Failed');
    });

    it('should return same singleton instance', () => {
        const s1 = ActivityService.getInstance();
        const s2 = ActivityService.getInstance();
        expect(s1).toBe(s2);
    });
});
