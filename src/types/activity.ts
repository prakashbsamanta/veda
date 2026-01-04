export type ActivityType = 'note' | 'task' | 'expense';

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurrenceRule {
    frequency: RecurrenceFrequency;
    interval?: number;
    endDate?: string;
}

export interface ActivityItem {
    id: string;
    user_id: string;
    type: ActivityType;
    title: string;
    description?: string;
    category?: string;
    created_at: string;
    // For expenses
    amount?: number;
    currency?: string;
    // Recurrence
    recurrence_rule?: string; // JSON string of RecurrenceRule
}
