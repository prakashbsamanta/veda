import { ActivityService } from '../ActivityService';
import { dbService } from '../DatabaseService';
import { logger } from '../../../utils/Logger';

// Mock dependencies
jest.mock('uuid', () => ({
    v4: () => 'test-uuid'
}));

jest.mock('../DatabaseService', () => ({
    dbService: {
        execute: jest.fn(),
        getAll: jest.fn(),
    }
}));

jest.mock('../../../utils/Logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    }
}));

describe('ActivityService', () => {
    let service: ActivityService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = ActivityService.getInstance();
    });

    describe('ensureSchema', () => {
        it('should migrate schema if recurrence_rule column is missing', async () => {
            (dbService.getAll as jest.Mock).mockResolvedValueOnce([
                { name: 'id' }, { name: 'title' }
            ]);

            await (service as any).ensureSchema();

            expect(dbService.execute).toHaveBeenCalledWith(
                expect.stringContaining('ALTER TABLE activities ADD COLUMN recurrence_rule JSON')
            );
        });

        it('should NOT migrate if column exists', async () => {
            (dbService.getAll as jest.Mock).mockResolvedValueOnce([
                { name: 'recurrence_rule' }
            ]);

            await (service as any).ensureSchema();

            expect(dbService.execute).not.toHaveBeenCalledWith(
                expect.stringContaining('ALTER TABLE')
            );
        });

        it('should handle schema check error gracefully', async () => {
            (dbService.getAll as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

            await (service as any).ensureSchema();

            expect(logger.error).toHaveBeenCalledWith(
                'Critical error in ActivityService schema check:',
                expect.any(Error)
            );
        });
    });

    describe('createActivity', () => {
        it('should create a note activity', async () => {
            await service.createActivity('user-1', {
                type: 'note',
                title: 'Test Note',
                description: 'Desc'
            });

            expect(dbService.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO activities'),
                expect.arrayContaining(['user-1', 'note', 'Test Note', 'Desc'])
            );
        });

        it('should create an expense activity with amount', async () => {
            await service.createActivity('user-1', {
                type: 'expense',
                title: 'Expense',
                amount: 50,
                currency: 'USD'
            });

            expect(dbService.execute).toHaveBeenCalledTimes(2);
            expect(dbService.execute).toHaveBeenNthCalledWith(2,
                expect.stringContaining('INSERT INTO expenses'),
                expect.arrayContaining([50, 'USD'])
            );
        });

        it('should throw error if db fails', async () => {
            (dbService.execute as jest.Mock).mockRejectedValueOnce(new Error('Insert failed'));

            await expect(service.createActivity('user-1', {
                type: 'note', title: 'Fail'
            })).rejects.toThrow('Insert failed');
        });
    });

    describe('getRecentActivities', () => {
        it('should return empty list on error', async () => {
            (dbService.getAll as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

            const results = await service.getRecentActivities('user-1');
            expect(results).toEqual([]);
            expect(logger.error).toHaveBeenCalled();
        });

        it('should return activities', async () => {
            const mockData = [{ id: '1', title: 'A' }];
            (dbService.getAll as jest.Mock).mockResolvedValueOnce(mockData);

            const results = await service.getRecentActivities('user-1');
            expect(results).toEqual(mockData);
        });
    });

    describe('updateActivity', () => {
        it('should update specific fields', async () => {
            await service.updateActivity('1', { title: 'New Title' });

            expect(dbService.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE activities SET title = ?'),
                ['New Title', '1']
            );
        });

        it('should update multiple fields including category', async () => {
            await service.updateActivity('1', { title: 'T', description: 'D', category: 'Work' });

            expect(dbService.execute).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE activities SET.*title = \?.*description = \?.*category = \?/),
                expect.arrayContaining(['T', 'D', 'Work', '1'])
            );
        });

        it('should update recurrence rule', async () => {
            await service.updateActivity('1', { recurrence_rule: 'rules' });

            expect(dbService.execute).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE activities SET.*recurrence_rule = \?/),
                expect.arrayContaining(['rules', '1'])
            );
        });

        it('should update expense fields if type is expense', async () => {
            await service.updateActivity('1', {
                type: 'expense', // Needed to trigger expense update block
                amount: 100
            } as any);

            expect(dbService.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE expenses SET amount = ?'),
                [100, '1']
            );
        });

        it('should update expense fields including currency', async () => {
            await service.updateActivity('1', {
                type: 'expense',
                amount: 100,
                currency: 'EUR'
            } as any);

            expect(dbService.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE expenses SET amount = ?, currency = ?'),
                [100, 'EUR', '1']
            );
        });

        it('should handle update error', async () => {
            (dbService.execute as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));
            await expect(service.updateActivity('1', { title: 'F' })).rejects.toThrow('Update failed');
        });
    });

    describe('deleteActivity', () => {
        it('should soft delete', async () => {
            await service.deleteActivity('1');
            expect(dbService.execute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE activities SET is_deleted = 1'),
                ['1']
            );
        });

        it('should handle error', async () => {
            (dbService.execute as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));
            await expect(service.deleteActivity('1')).rejects.toThrow('Delete failed');
        });
    });
});
