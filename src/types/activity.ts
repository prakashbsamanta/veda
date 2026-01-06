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
    attachment_count?: number;
}

export type AttachmentType = 'image' | 'video' | 'pdf' | 'document';

export interface Attachment {
    id: string;
    activity_id: string;
    type: AttachmentType;
    local_path: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    uploaded_at: string;
}
