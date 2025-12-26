export const SCHEMA_QUERIES = [
    // Users
    `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    google_id TEXT UNIQUE,
    display_name TEXT NOT NULL,
    avatar_path TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP
  );`,

    // Activities
    `CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('note', 'task', 'expense', 'reminder')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    category TEXT,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    sync_status TEXT DEFAULT 'local',
    is_deleted BOOLEAN DEFAULT 0,
    suggested_template TEXT,
    ai_processed_at TIMESTAMP,
    ai_provider TEXT,
    ai_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
    `CREATE INDEX IF NOT EXISTS idx_user_created ON activities(user_id, created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_user_due ON activities(user_id, due_date);`,
    `CREATE INDEX IF NOT EXISTS idx_user_category ON activities(user_id, category);`,

    // Notes
    `CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood TEXT,
    location JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

    // Task Templates (Needed before Tasks because of FK)
    `CREATE TABLE IF NOT EXISTS task_templates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    fields JSON NOT NULL,
    default_recurrence JSON NOT NULL,
    default_priority TEXT,
    default_tags TEXT,
    created_from_activity_id TEXT REFERENCES activities(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
    `CREATE INDEX IF NOT EXISTS idx_user_templates ON task_templates(user_id, created_at DESC);`,

    // Tasks
    `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    priority TEXT DEFAULT 'medium',
    recurrence JSON NOT NULL,
    next_due_date TIMESTAMP,
    last_completed_at TIMESTAMP,
    suggested_interval INTEGER,
    suggested_next_due_date TIMESTAMP,
    ai_reason TEXT,
    is_template BOOLEAN DEFAULT 0,
    template_id TEXT REFERENCES task_templates(id),
    template_name TEXT,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
  );`,
    `CREATE INDEX IF NOT EXISTS idx_next_due ON tasks(next_due_date);`,
    `CREATE INDEX IF NOT EXISTS idx_is_template ON tasks(is_template);`,

    // Task Completions
    `CREATE TABLE IF NOT EXISTS task_completions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    completed_at TIMESTAMP NOT NULL,
    completed_in_days INTEGER,
    notes TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );`,
    `CREATE INDEX IF NOT EXISTS idx_task_completed ON task_completions(task_id, completed_at DESC);`,

    // Attachments (Needed before Expenses because of FK)
    `CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('image', 'pdf', 'document')),
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
  );`,
    `CREATE INDEX IF NOT EXISTS idx_activity_attachments ON attachments(activity_id);`,

    // Expenses
    `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT,
    vendor TEXT,
    receipt_id TEXT REFERENCES attachments(id),
    receipt_ocr JSON,
    linked_task_id TEXT REFERENCES tasks(id),
    recurring BOOLEAN DEFAULT 0,
    recurring_frequency TEXT,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_task_id) REFERENCES tasks(id)
  );`,
    `CREATE INDEX IF NOT EXISTS idx_amount ON expenses(activity_id, amount);`,
    `CREATE INDEX IF NOT EXISTS idx_vendor ON expenses(vendor);`,

    // Reminders
    `CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL UNIQUE REFERENCES activities(id) ON DELETE CASCADE,
    trigger_type TEXT,
    trigger_time TIMESTAMP,
    trigger_location JSON,
    linked_task_id TEXT REFERENCES tasks(id),
    notification_type TEXT DEFAULT 'notification',
    repeat_count INTEGER,
    recurrence JSON NOT NULL,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_task_id) REFERENCES tasks(id)
  );`,

    // Sync Queue
    `CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload JSON NOT NULL,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    ai_provider TEXT,
    ai_call_attempted BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,
    `CREATE INDEX IF NOT EXISTS idx_pending_sync ON sync_queue(user_id, status, created_at);`,

    // LLM Call Log
    `CREATE TABLE IF NOT EXISTS llm_call_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'perplexity', 'claude', 'custom')),
    model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    tokens_used INTEGER,
    cost_usd DECIMAL(8, 4),
    success BOOLEAN DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    related_activity_id TEXT REFERENCES activities(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_activity_id) REFERENCES activities(id) ON DELETE SET NULL
  );`,
    `CREATE INDEX IF NOT EXISTS idx_user_llm_calls ON llm_call_logs(user_id, created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_provider_cost ON llm_call_logs(provider, cost_usd);`
];
