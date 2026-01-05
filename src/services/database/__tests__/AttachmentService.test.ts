import { attachmentService } from '../AttachmentService';
import { dbService } from '../DatabaseService';
import * as FileSystem from 'expo-file-system/legacy';

// Mock dependencies
jest.mock('expo-file-system/legacy', () => ({
    documentDirectory: 'file:///test-directory/',
    getInfoAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    copyAsync: jest.fn(),
    deleteAsync: jest.fn(),
}));

jest.mock('../DatabaseService', () => ({
    dbService: {
        init: jest.fn(),
        execute: jest.fn(),
        getAll: jest.fn(),
        getDatabase: jest.fn(),
        getFirst: jest.fn(),
    },
}));

jest.mock('../../../utils/Logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
    }
}));

// Mock UUID
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid'),
}));

// Mock DatabaseService setup helper
const mockTransaction = jest.fn(async (callback) => await callback());
const mockExecAsync = jest.fn();
const mockRunAsync = jest.fn();

const setupDbMock = (hasMigration = false) => {
    return {
        dbService: {
            init: jest.fn(),
            execute: jest.fn(),
            getAll: jest.fn().mockImplementation((query) => {
                if (query.includes('FROM migrations')) {
                    return Promise.resolve(hasMigration ? [{ id: '001_add_video_attachment_support' }] : []);
                }
                return Promise.resolve([]);
            }),
            getDatabase: jest.fn().mockReturnValue({
                withTransactionAsync: mockTransaction,
                execAsync: mockExecAsync,
                runAsync: mockRunAsync,
            }),
            getFirst: jest.fn(),
        }
    };
};


describe('AttachmentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Note: ensureSchema and ensureDirectory run in constructor.
    // If we want to test them, we might need to reset modules.
    // However, since attachmentService is a singleton exported instance, 
    // it's created at module load.
    // We can rely on basic tests for methods first.

    describe('saveAttachment', () => {
        it('should save an attachment successfully', async () => {
            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 1024 });
            (dbService.execute as jest.Mock).mockResolvedValue({ insertId: 1 });

            const result = await attachmentService.saveAttachment('activity-1', 'file://source/image.jpg', 'image');

            expect(FileSystem.copyAsync).toHaveBeenCalledWith({
                from: 'file://source/image.jpg',
                to: 'file:///test-directory/attachments/test-uuid.jpg'
            });

            expect(dbService.execute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO attachments'),
                expect.arrayContaining(['test-uuid', 'activity-1', 'image', 'file:///test-directory/attachments/test-uuid.jpg', 'test-uuid.jpg', 1024])
            );

            expect(result).toEqual(expect.objectContaining({
                id: 'test-uuid',
                local_path: 'file:///test-directory/attachments/test-uuid.jpg',
                file_size: 1024
            }));
        });
    });

    describe('getAttachmentsForActivity', () => {
        it('should fetch attachments', async () => {
            const mockAttachments = [{ id: '1', type: 'image' }];
            (dbService.getAll as jest.Mock).mockResolvedValue(mockAttachments);

            const result = await attachmentService.getAttachmentsForActivity('activity-1');

            expect(dbService.getAll).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM attachments'),
                ['activity-1']
            );
            expect(result).toBe(mockAttachments);
        });
    });

    describe('deleteAttachment', () => {
        it('should delete attachment from DB and FileSystem', async () => {
            const mockAttachment = { id: 'aid', local_path: 'path/to/file' };
            (dbService.getAll as jest.Mock).mockResolvedValue([mockAttachment]);
            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

            await attachmentService.deleteAttachment('aid');

            expect(dbService.getAll).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM attachments WHERE id = ?'), ['aid']);
            expect(dbService.execute).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM attachments'), ['aid']);
            expect(FileSystem.deleteAsync).toHaveBeenCalledWith('path/to/file');
        });

        it('should not try to delete file if it does not exist', async () => {
            const mockAttachment = { id: 'aid', local_path: 'path/to/file' };
            (dbService.getAll as jest.Mock).mockResolvedValue([mockAttachment]);
            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

            await attachmentService.deleteAttachment('aid');

            expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
        });
    });

    describe('ensureSchema (Migration)', () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
            // Re-mock dependencies that are not the focus but needed
            jest.mock('expo-file-system/legacy', () => ({
                documentDirectory: 'file:///test-directory/',
                getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
                makeDirectoryAsync: jest.fn(),
            }));
            jest.mock('../../../utils/Logger', () => ({
                logger: {
                    error: jest.fn(),
                    info: jest.fn(),
                }
            }));
            jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));
        });

        it('should run migration if not present', async () => {
            // Mock DB to return NO migration
            jest.doMock('../DatabaseService', () => setupDbMock(false));

            const { AttachmentService } = require('../AttachmentService');
            // Trigger singleton creation
            AttachmentService.getInstance();

            // Wait for async constructor operations
            await new Promise(resolve => setTimeout(resolve, 50));

            const { dbService } = require('../DatabaseService');
            // Verify migration steps
            const db = dbService.getDatabase();
            expect(db.withTransactionAsync).toHaveBeenCalled();
            expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE attachments RENAME'));
            expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS attachments'));
            expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO attachments'));
            expect(mockExecAsync).toHaveBeenCalledWith(expect.stringContaining('DROP TABLE attachments_old'));
            expect(mockRunAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO migrations'), ['001_add_video_attachment_support']);
        });

        it('should NOT run migration if already present', async () => {
            // Mock DB to return migration PRESENT
            jest.doMock('../DatabaseService', () => setupDbMock(true));

            const { AttachmentService } = require('../AttachmentService');
            AttachmentService.getInstance();

            await new Promise(resolve => setTimeout(resolve, 50));

            const { dbService } = require('../DatabaseService');
            // Validate NO transaction
            // Note: getDatabase might be called, but withTransactionAsync should not be called if check returns true.
            // Wait, our mock implements getAll to return present.
            // ensureSchema calls getAll first.
            expect(dbService.getAll).toHaveBeenCalledWith(expect.stringContaining('FROM migrations'));
            expect(mockTransaction).not.toHaveBeenCalled();
        });

        it('should create directory if missing', async () => {
            jest.doMock('../DatabaseService', () => setupDbMock(false));
            jest.mock('expo-file-system/legacy', () => ({
                documentDirectory: 'file:///test-directory/',
                getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
                makeDirectoryAsync: jest.fn(),
            }));

            const { AttachmentService } = require('../AttachmentService');
            AttachmentService.getInstance();
            await new Promise(resolve => setTimeout(resolve, 50));

            const FileSystem = require('expo-file-system/legacy');
            expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
        });
    });



    it('should handle deleteAttachment when id not found', async () => {
        (dbService.getAll as jest.Mock).mockResolvedValue([]); // Not found
        await attachmentService.deleteAttachment('non-existent');
        expect(dbService.execute).not.toHaveBeenCalledWith(expect.stringContaining('DELETE'));
    });

    it('should save attachment even if file size unknown', async () => {
        (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
        (dbService.execute as jest.Mock).mockResolvedValue({ insertId: 1 });

        const result = await attachmentService.saveAttachment('1', 'uri', 'image');
        expect(result.file_size).toBe(0);
    });


    describe('Error Handling', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
        });

        it('should handle saveAttachment error', async () => {
            (FileSystem.copyAsync as jest.Mock).mockRejectedValue(new Error('Copy failed'));
            await expect(attachmentService.saveAttachment('1', 'uri', 'image')).rejects.toThrow('Copy failed');
        });

        it('should handle getAttachmentsForActivity error', async () => {
            (dbService.getAll as jest.Mock).mockRejectedValue(new Error('DB failed'));
            const logs = [];
            // Assuming logger is mocked in top scope
            await attachmentService.getAttachmentsForActivity('1');
            // Check calling logger? Use Spy on mock if possible, but strict asserts might suffice.
            // Function returns empty array on error.
            const result = await attachmentService.getAttachmentsForActivity('1');
            expect(result).toEqual([]);
        });

        it('should handle deleteAttachment error', async () => {
            (dbService.getAll as jest.Mock).mockRejectedValue(new Error('Delete DB failed'));
            await expect(attachmentService.deleteAttachment('1')).rejects.toThrow('Delete DB failed');
        });

        // Testing ensureDirectory error requires resetting specific mock for just one call?
        // ensureDirectory is private and called in constructor.
        // We can't easily trigger it again without resetModules.
        // Skipping line 28/30 (directory error) is acceptable if >90% global.
    });
});
