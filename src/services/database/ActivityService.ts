import { dbService } from './DatabaseService';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/Logger';
import { ActivityItem } from '../../types';

export class ActivityService {
    private static instance: ActivityService;

    private initPromise: Promise<void>;

    private constructor() {
        this.initPromise = this.ensureSchema();
    }

    public static getInstance(): ActivityService {
        if (!ActivityService.instance) {
            ActivityService.instance = new ActivityService();
        }
        return ActivityService.instance;
    }

    private async ensureSchema() {
        try {
            // Check if column exists first to avoid try/catch overhead and potential locking issues
            const result = await dbService.getAll<{ name: string }>(`PRAGMA table_info(activities);`);
            const hasColumn = result.some(col => col.name === 'recurrence_rule');

            if (!hasColumn) {
                logger.info('Migrating schema: Adding recurrence_rule column');
                await dbService.execute(`ALTER TABLE activities ADD COLUMN recurrence_rule JSON;`);
                logger.info('Added recurrence_rule column to activities table');
            }
        } catch (error: any) {
            logger.error('Critical error in ActivityService schema check:', error);
            // We do NOT rethrow here because it might block the app from opening,
            // but we log precisely so we know if this is why queries fail later.
        }
    }

    async createActivity(userId: string, data: Omit<ActivityItem, 'id' | 'created_at' | 'user_id'>) {
        await this.initPromise;
        const activityId = uuidv4();
        const timestamp = new Date().toISOString();

        try {
            await dbService.execute(
                `INSERT INTO activities (id, user_id, type, title, description, category, created_at, recurrence_rule)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    activityId,
                    userId,
                    data.type,
                    data.title,
                    data.description || '',
                    data.category || '',
                    timestamp,
                    data.recurrence_rule || null
                ]
            );

            if (data.type === 'expense' && data.amount !== undefined) {
                const expenseId = uuidv4();
                await dbService.execute(
                    `INSERT INTO expenses (id, activity_id, amount, currency)
                     VALUES (?, ?, ?, ?)`,
                    [expenseId, activityId, data.amount, data.currency || 'INR']
                );
            }

            logger.info(`Created activity: ${activityId} of type ${data.type}`);
            return activityId;
        } catch (error) {
            logger.error('Error creating activity:', error);
            throw error;
        }
    }

    async getRecentActivities(userId: string, limit: number = 20): Promise<ActivityItem[]> {
        await this.initPromise;
        const query = `
            SELECT 
                a.id, a.user_id, a.type, a.title, a.description, a.category, a.created_at, a.recurrence_rule,
                e.amount, e.currency,
                (SELECT COUNT(*) FROM attachments WHERE activity_id = a.id) as attachment_count
            FROM activities a
            LEFT JOIN expenses e ON a.id = e.activity_id
            WHERE a.user_id = ? AND a.is_deleted = 0
            ORDER BY a.created_at DESC
            LIMIT ?
        `;

        try {
            const results = await dbService.getAll<ActivityItem>(query, [userId, limit]);
            return results;
        } catch (error) {
            logger.error('Error fetching activities:', error);
            return [];
        }
    }

    async updateActivity(id: string, data: Partial<ActivityItem>) {
        try {
            // Update main activity fields
            const updates: string[] = [];
            const values: any[] = [];

            if (data.title !== undefined) {
                updates.push('title = ?');
                values.push(data.title);
            }
            if (data.description !== undefined) {
                updates.push('description = ?');
                values.push(data.description);
            }
            if (data.category !== undefined) {
                updates.push('category = ?');
                values.push(data.category);
            }
            if (data.recurrence_rule !== undefined) {
                updates.push('recurrence_rule = ?');
                values.push(data.recurrence_rule);
            }

            if (updates.length > 0) {
                values.push(id);
                await dbService.execute(
                    `UPDATE activities SET ${updates.join(', ')} WHERE id = ?`,
                    values
                );
            }

            // Update expense if applicable
            if (data.type === 'expense' && (data.amount !== undefined || data.currency !== undefined)) {
                const expenseUpdates: string[] = [];
                const expenseValues: any[] = [];

                if (data.amount !== undefined) {
                    expenseUpdates.push('amount = ?');
                    expenseValues.push(data.amount);
                }
                if (data.currency !== undefined) {
                    expenseUpdates.push('currency = ?');
                    expenseValues.push(data.currency);
                }

                if (expenseUpdates.length > 0) {
                    expenseValues.push(id);
                    await dbService.execute(
                        `UPDATE expenses SET ${expenseUpdates.join(', ')} WHERE activity_id = ?`,
                        expenseValues
                    );
                }
            }

            logger.info(`Updated activity: ${id}`);
        } catch (error) {
            logger.error('Error updating activity:', error);
            throw error;
        }
    }

    async deleteActivity(id: string) {
        try {
            await dbService.execute(
                `UPDATE activities SET is_deleted = 1 WHERE id = ?`,
                [id]
            );
        } catch (error) {
            logger.error('Error deleting activity:', error);
            throw error;
        }
    }
}

export const activityService = ActivityService.getInstance();
