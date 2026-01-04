export class LocalCategorizer {
    // Simple keyword-based categorization for offline MVP
    private static keywords: Record<string, string[]> = {
        'Food & Drinks': ['starbucks', 'mcdonalds', 'coffee', 'cafe', 'restaurant', 'burger', 'pizza', 'food'],
        'Groceries': ['whole foods', 'trader joes', 'kroger', 'walmart', 'grocery', 'market'],
        'Transport': ['uber', 'lyft', 'taxi', 'fuel', 'gas', 'shell', 'metro', 'train', 'bus'],
        'Shopping': ['amazon', 'target', 'clothing', 'store'],
        'Bills': ['electric', 'water', 'internet', 'subscription', 'netflix', 'spotify'],
    };

    public static categorize(text: string): string {
        const lowerText = text.toLowerCase();

        for (const [category, words] of Object.entries(this.keywords)) {
            if (words.some(word => lowerText.includes(word))) {
                return category;
            }
        }

        return 'Uncategorized';
    }

    public static suggestType(text: string): 'note' | 'task' | 'expense' {
        const lowerText = text.toLowerCase();

        const expenseKeywords = ['buy', 'pay', 'cost', 'spent', 'bill', 'subscription', 'price', '$', 'inr', 'rupees'];
        const taskKeywords = ['call', 'meet', 'schedule', 'remind', 'deadline', 'todo', 'submit', 'finish', 'complete'];

        if (expenseKeywords.some(w => lowerText.includes(w))) return 'expense';
        if (taskKeywords.some(w => lowerText.includes(w))) return 'task';

        return 'note';
    }
}
