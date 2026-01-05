import { documentDirectory, getInfoAsync, makeDirectoryAsync, copyAsync, deleteAsync } from 'expo-file-system/legacy';
import { dbService } from './DatabaseService';
import { v4 as uuidv4 } from 'uuid';
import { Attachment, AttachmentType } from '../../types';
import { logger } from '../../utils/Logger';

const ATTACHMENTS_DIR = (documentDirectory || '') + 'attachments/';

export class AttachmentService {
    private static instance: AttachmentService;

    private constructor() {
        this.ensureDirectory();
        this.ensureSchema();
    }

    public static getInstance(): AttachmentService {
        if (!AttachmentService.instance) {
            AttachmentService.instance = new AttachmentService();
        }
        return AttachmentService.instance;
    }

    private async ensureDirectory() {
        try {
            const dirInfo = await getInfoAsync(ATTACHMENTS_DIR);
            if (!dirInfo.exists) {
                await makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
            }
        } catch (error) {
            logger.error('Error ensuring attachments directory:', error);
        }
    }

    private async ensureSchema() {
        try {
            await dbService.init();

            // Create migrations table
            await dbService.execute(`
                CREATE TABLE IF NOT EXISTS migrations (
                    id TEXT PRIMARY KEY,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            const hasMigration = await dbService.getAll(`SELECT id FROM migrations WHERE id = '001_add_video_attachment_support'`);
            if (hasMigration.length === 0) {
                logger.info('Migrating schema: Adding video support to attachments');
                const db = dbService.getDatabase();

                await db.withTransactionAsync(async () => {
                    // 1. Rename old table
                    await db.execAsync(`ALTER TABLE attachments RENAME TO attachments_old;`);

                    // 2. Create new table
                    await db.execAsync(`
                        CREATE TABLE IF NOT EXISTS attachments (
                            id TEXT PRIMARY KEY,
                            activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
                            type TEXT NOT NULL CHECK (type IN ('image', 'pdf', 'document', 'video')),
                            local_path TEXT NOT NULL,
                            file_name TEXT NOT NULL,
                            file_size INTEGER,
                            mime_type TEXT,
                            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            compressed BOOLEAN DEFAULT 0,
                            original_size INTEGER,
                            ocr_status TEXT DEFAULT 'pending',
                            ocr_data JSON,
                            ocr_provider TEXT,
                            FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
                        );
                    `);

                    // 3. Copy data
                    await db.execAsync(`
                         INSERT INTO attachments (id, activity_id, type, local_path, file_name, file_size, mime_type, uploaded_at, compressed, original_size, ocr_status, ocr_data, ocr_provider)
                         SELECT id, activity_id, type, local_path, file_name, file_size, mime_type, uploaded_at, compressed, original_size, ocr_status, ocr_data, ocr_provider
                         FROM attachments_old;
                    `);

                    // 4. Drop old table
                    await db.execAsync(`DROP TABLE attachments_old;`);

                    // 5. Recreate index
                    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_activity_attachments ON attachments(activity_id);`);

                    // 6. Record migration
                    await db.runAsync(`INSERT INTO migrations (id) VALUES (?)`, ['001_add_video_attachment_support']);
                });
                logger.info('Migration 001_add_video_attachment_support completed');
            }
        } catch (error) {
            // logger.error('Error during schema migration:', error);
        }
    }

    async saveAttachment(activityId: string, fileUri: string, type: AttachmentType): Promise<Attachment> {
        try {
            await this.ensureDirectory();

            const extension = fileUri.split('.').pop();
            const fileName = `${uuidv4()}.${extension}`;
            const newPath = ATTACHMENTS_DIR + fileName;

            await copyAsync({
                from: fileUri,
                to: newPath
            });

            const fileInfo = await getInfoAsync(newPath);
            const id = uuidv4();
            const timestamp = new Date().toISOString();

            await dbService.execute(
                `INSERT INTO attachments (id, activity_id, type, local_path, file_name, file_size, uploaded_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, activityId, type, newPath, fileName, fileInfo.exists ? fileInfo.size : 0, timestamp]
            );

            return {
                id,
                activity_id: activityId,
                type,
                local_path: newPath,
                file_name: fileName,
                file_size: fileInfo.exists ? fileInfo.size : 0,
                uploaded_at: timestamp
            };
        } catch (error) {
            logger.error('Error saving attachment:', error);
            throw error;
        }
    }

    async getAttachmentsForActivity(activityId: string): Promise<Attachment[]> {
        try {
            const results = await dbService.getAll<Attachment>(
                `SELECT * FROM attachments WHERE activity_id = ? ORDER BY uploaded_at DESC`,
                [activityId]
            );
            return results;
        } catch (error) {
            logger.error('Error fetching attachments:', error);
            return [];
        }
    }

    async deleteAttachment(id: string) {
        try {
            const results = await dbService.getAll<Attachment>(
                `SELECT * FROM attachments WHERE id = ?`,
                [id]
            );

            if (results.length > 0) {
                const attachment = results[0];
                // Delete from DB
                await dbService.execute(`DELETE FROM attachments WHERE id = ?`, [id]);

                // Delete file
                const fileInfo = await getInfoAsync(attachment.local_path);
                if (fileInfo.exists) {
                    await deleteAsync(attachment.local_path);
                }
            }
        } catch (error) {
            logger.error('Error deleting attachment:', error);
            throw error;
        }
    }
}

export const attachmentService = AttachmentService.getInstance();
