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

    describe('suggestType', () => {
        it('should suggest expense for cost keywords', () => {
            expect(LocalCategorizer.suggestType('buy items')).toBe('expense');
            expect(LocalCategorizer.suggestType('pay bill')).toBe('expense');
            expect(LocalCategorizer.suggestType('total cost is 50')).toBe('expense');
            expect(LocalCategorizer.suggestType('spent money')).toBe('expense');
            expect(LocalCategorizer.suggestType('subscription fee')).toBe('expense');
        });

        it('should suggest task for action keywords', () => {
            expect(LocalCategorizer.suggestType('call mom')).toBe('task');
            expect(LocalCategorizer.suggestType('meet with team')).toBe('task');
            expect(LocalCategorizer.suggestType('schedule appointment')).toBe('task');
            expect(LocalCategorizer.suggestType('deadline tomorrow')).toBe('task');
            expect(LocalCategorizer.suggestType('finish report')).toBe('task');
        });

        it('should fallback to note', () => {
            expect(LocalCategorizer.suggestType('just a random thought')).toBe('note');
            expect(LocalCategorizer.suggestType('daily journal')).toBe('note');
        });

        it('should be case insensitive', () => {
            expect(LocalCategorizer.suggestType('BUY GROCERIES')).toBe('expense');
            expect(LocalCategorizer.suggestType('CALL CLIENT')).toBe('task');
        });
    });
});
