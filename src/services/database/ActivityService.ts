import { dbService } from './DatabaseService';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/Logger';

export interface ActivityItem {
    id: string;
    user_id: string;
    type: 'note' | 'task' | 'expense';
    title: string;
    description?: string;
    category?: string;
    created_at: string;
    // For expenses
    amount?: number;
    currency?: string;
}

export class ActivityService {
    private static instance: ActivityService;

    private constructor() { }

    public static getInstance(): ActivityService {
        if (!ActivityService.instance) {
            ActivityService.instance = new ActivityService();
        }
        return ActivityService.instance;
    }

    async createActivity(userId: string, data: Omit<ActivityItem, 'id' | 'created_at' | 'user_id'>) {
        const activityId = uuidv4();
        const timestamp = new Date().toISOString();

        try {
            await dbService.execute(
                `INSERT INTO activities (id, user_id, type, title, description, category, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [activityId, userId, data.type, data.title, data.description || '', data.category || '', timestamp]
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
        const query = `
            SELECT 
                a.id, a.user_id, a.type, a.title, a.description, a.category, a.created_at,
                e.amount, e.currency
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
