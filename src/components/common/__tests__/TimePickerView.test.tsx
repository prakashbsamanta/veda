import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TimePickerView from '../TimePickerView';

describe('TimePickerView', () => {
    const mockOnTimeChange = jest.fn();
    const initialDate = new Date('2025-01-01T10:30:00'); // 10:30 AM
    const pmDate = new Date('2025-01-01T22:30:00'); // 10:30 PM (22:30)

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correct time', () => {
        const { getAllByText, getByText } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        expect(getAllByText('10').length).toBeGreaterThan(0);
        expect(getAllByText('30').length).toBeGreaterThan(0);
        expect(getByText('AM')).toBeTruthy();
    });

    // --- AM/PM Toggle Tests ---

    it('should toggle AM to PM', () => {
        const { getByText } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        fireEvent.press(getByText('PM'));

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        expect(newDate.getHours()).toBe(22); // 10 + 12
    });

    it('should toggle PM to AM', () => {
        const { getByText } = render(
            <TimePickerView
                selectedDate={pmDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        fireEvent.press(getByText('AM'));

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        expect(newDate.getHours()).toBe(10); // 22 - 12
    });

    it('should NOT toggle if already AM and AM pressed', () => {
        const { getByText } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        fireEvent.press(getByText('AM'));
        expect(mockOnTimeChange).not.toHaveBeenCalled();
    });

    it('should NOT toggle if already PM and PM pressed', () => {
        const { getByText } = render(
            <TimePickerView
                selectedDate={pmDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        fireEvent.press(getByText('PM'));
        expect(mockOnTimeChange).not.toHaveBeenCalled();
    });

    // --- Hour Selection Tests ---

    it('should handle hour selection in AM', () => {
        const { getAllByText } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        // Select "02" hour
        const items = getAllByText('02');
        fireEvent.press(items[0]);

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        expect(newDate.getHours()).toBe(2);
    });

    it('should handle hour selection in PM (non-12)', () => {
        const { getAllByText } = render(
            <TimePickerView
                selectedDate={pmDate} // 22:30
                onTimeChange={mockOnTimeChange}
            />
        );

        // Select "02" hour -> should be 14:00 (2 PM)
        const items = getAllByText('02');
        fireEvent.press(items[0]);

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        expect(newDate.getHours()).toBe(14);
    });

    it('should handle 12 AM selection (00:00 case)', () => {
        // Start at 10:30 AM
        const { getAllByText } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        // Select "12" hour while in AM mode -> should be 00:xx
        const items = getAllByText('12');
        fireEvent.press(items[0]);

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        expect(newDate.getHours()).toBe(0);
    });

    it('should handle 12 PM selection (12:00 case)', () => {
        // Start at 10:30 PM
        const { getAllByText } = render(
            <TimePickerView
                selectedDate={pmDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        // Select "12" hour while in PM mode -> should be 12:xx
        const items = getAllByText('12');
        fireEvent.press(items[0]);

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        expect(newDate.getHours()).toBe(12);
    });

    // --- Minute Selection Tests ---

    it('should handle minute selection', () => {
        const { getAllByText } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        const items = getAllByText('05');
        // Ensure we pick from minute list (second occurrence typically, or specific testID if added)
        // Given structure, hours are 1-12, minutes 0-59. '05' is in both.
        // First flatlist is Hours, second is Minutes.
        // We can differentiate by parent view or order.
        // In this simple test without testIDs, we rely on getAllByText order.
        // Hours list comes first in JSX.
        fireEvent.press(items[items.length - 1]); // Press last one (minutes)

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        expect(newDate.getMinutes()).toBe(5);
    });

    // --- Scroll Event Simulation (Branch Coverage) ---

    it('should handle scroll events for Hour', () => {
        const { getByText, UNSAFE_getAllByType } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        // Find FlatLists. First one is Hour.
        const flatLists = UNSAFE_getAllByType(require('react-native').FlatList);
        const hourList = flatLists[0];

        // Simulate scroll end. ITEM_HEIGHT = 50.
        // Helper to scroll to index 3 (Hour 4, since hoursData is 1-12) -> wait, hoursData[3] is 4.
        // index * HEIGHT = y offset.
        // Let's scroll to index 2 (Hour 3). 2 * 50 = 100.
        fireEvent(hourList, 'momentumScrollEnd', {
            nativeEvent: { contentOffset: { y: 100 } }
        });

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        // hoursData = [1, 2, 3, 4 ...]. Index 2 is 3.
        expect(newDate.getHours()).toBe(3);
    });

    it('should handle scroll events for Minute', () => {
        const { UNSAFE_getAllByType } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        const flatLists = UNSAFE_getAllByType(require('react-native').FlatList);
        const minuteList = flatLists[1];

        // Scroll to index 15 (Minute 15). 15 * 50 = 750.
        fireEvent(minuteList, 'momentumScrollEnd', {
            nativeEvent: { contentOffset: { y: 750 } }
        });

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        expect(newDate.getMinutes()).toBe(15);
    });

    it('should ignore scroll events with invalid index', () => {
        const { UNSAFE_getAllByType } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        const flatLists = UNSAFE_getAllByType(require('react-native').FlatList);
        const hourList = flatLists[0];

        // Negative scroll
        fireEvent(hourList, 'momentumScrollEnd', {
            nativeEvent: { contentOffset: { y: -50 } }
        });

        expect(mockOnTimeChange).not.toHaveBeenCalled();
    });
});
