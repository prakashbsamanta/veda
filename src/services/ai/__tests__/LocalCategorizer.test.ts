import { LocalCategorizer } from '../LocalCategorizer';

describe('LocalCategorizer', () => {
    it('should categorize Food & Drinks', () => {
        expect(LocalCategorizer.categorize('starbucks')).toBe('Food & Drinks');
        expect(LocalCategorizer.categorize('coffee')).toBe('Food & Drinks');
    });

    it('should categorize Groceries', () => {
        expect(LocalCategorizer.categorize('Walmart receipt')).toBe('Groceries');
        expect(LocalCategorizer.categorize('market run')).toBe('Groceries');
    });

    it('should categorize Transport', () => {
        expect(LocalCategorizer.categorize('Uber trip')).toBe('Transport');
        expect(LocalCategorizer.categorize('filling gas at Shell')).toBe('Transport');
    });

    it('should categorize Shopping', () => {
        expect(LocalCategorizer.categorize('Amazon order')).toBe('Shopping');
    });

    it('should categorize Bills', () => {
        expect(LocalCategorizer.categorize('Netflix subscription')).toBe('Bills');
    });

    it('should return Uncategorized for unknown text', () => {
        expect(LocalCategorizer.categorize('Random text 123')).toBe('Uncategorized');
    });

    it('should be case insensitive', () => {
        expect(LocalCategorizer.categorize('STARBUCKS')).toBe('Food & Drinks');
    });

    it('should prioritize order of definition (implicit)', () => {
        // If "food" shares keywords with others? Currently no overlap in lists.
        // But if text matches multiple? e.g. "amazon coffee"
        // 'Food & Drinks' is defined first in the map (usually insertion order preserved in recent JS, but object order not guaranteed unless Map).
        // However, implementation iterates Object.entries.
        // This is implementation detail but checking behavior is good.
        expect(LocalCategorizer.categorize('amazon coffee')).toBe('Food & Drinks');
        // Assuming Food comes before Shopping in iteration.
    });
});
