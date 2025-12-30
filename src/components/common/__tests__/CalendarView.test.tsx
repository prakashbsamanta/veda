import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CalendarView from '../CalendarView';

describe('CalendarView', () => {
    const mockOnDateSelect = jest.fn();
    const initialDate = new Date('2025-01-15T10:00:00'); // Valid fixed date

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correct month and year', () => {
        const { getByText } = render(
            <CalendarView
                selectedDate={initialDate}
                onDateSelect={mockOnDateSelect}
            />
        );

        expect(getByText('January 2025')).toBeTruthy();
    });

    it('should navigate to next and previous months', () => {
        const { getByText, UNSAFE_getAllByType } = render(
            <CalendarView
                selectedDate={initialDate}
                onDateSelect={mockOnDateSelect}
            />
        );
        const { TouchableOpacity } = require('react-native');

        // Find nav buttons (first 2 touchables are usually back/next in this layout)
        // Or better, identifying them by some context if no testID.
        // We know they wrap ChevronLeft/ChevronRight.
        // Since we mock lucide, let's look for test structure or try to find by accessibility?
        // Code: <TouchableOpacity onPress={() => changeMonth(-1)}...>
        // Let's assume the first Touchable is prev, second is next? Not reliable.
        // But headers are first.

        // Let's use `getAllByRole` if available or `findAllBy` specific elements?
        // Lucide icons don't have text.
        // Let's rely on finding ALL touchables and picking the first two.
        const buttons = UNSAFE_getAllByType(TouchableOpacity);
        const prevBtn = buttons[0];
        const nextBtn = buttons[2]; // Index 1 is title? No title is Text. So ID 1 is next?
        // Header structure: Button, Text, Button.

        // Let's verify initial state: Jan 2025.
        // Click Next (2nd button in header)
        fireEvent.press(buttons[1]);
        expect(getByText('February 2025')).toBeTruthy();

        // Click Prev (1st button) -> Back to Jan
        fireEvent.press(buttons[0]);
        expect(getByText('January 2025')).toBeTruthy();

        // Click Prev again -> Dec 2024
        fireEvent.press(buttons[0]);
        expect(getByText('December 2024')).toBeTruthy();
    });

    it('should handle day selection', () => {
        const { getByText } = render(
            <CalendarView
                selectedDate={initialDate}
                onDateSelect={mockOnDateSelect}
            />
        );

        // Select 20th
        fireEvent.press(getByText('20'));

        expect(mockOnDateSelect).toHaveBeenCalled();
        const selected = mockOnDateSelect.mock.calls[0][0];
        // Month is Jan (0)
        expect(selected.getDate()).toBe(20);
        expect(selected.getMonth()).toBe(0);
        expect(selected.getFullYear()).toBe(2025);
        // Should preserve time
        expect(selected.getHours()).toBe(10);
    });

    it('should disable dates before minDate', () => {
        const minDate = new Date('2025-01-10T00:00:00');
        const { getByText } = render(
            <CalendarView
                selectedDate={initialDate}
                onDateSelect={mockOnDateSelect}
                minDate={minDate}
            />
        );

        // 5th is before 10th
        const day5 = getByText('5');
        fireEvent.press(day5);
        expect(mockOnDateSelect).not.toHaveBeenCalled();

        // 15th is allowed
        const day15 = getByText('15');
        fireEvent.press(day15);
        expect(mockOnDateSelect).toHaveBeenCalled();
    });
});
