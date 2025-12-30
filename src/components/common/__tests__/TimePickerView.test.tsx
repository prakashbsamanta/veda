import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TimePickerView from '../TimePickerView';

describe('TimePickerView', () => {
    const mockOnTimeChange = jest.fn();
    const initialDate = new Date('2025-01-01T10:30:00'); // 10:30 AM

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

    it('should toggle AM/PM', () => {
        const { getByText } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        const pmButton = getByText('PM');
        fireEvent.press(pmButton);

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        expect(newDate.getHours()).toBe(22);
    });

    it('should handle hour selection', () => {
        const { getAllByText } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        // "02" is in Hour list (index 1) and Minute list (index 2)
        // Both rendered.
        const items = getAllByText('02');
        // Hour list is first.
        fireEvent.press(items[0]);

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        // 10:30 -> 02:30
        expect(newDate.getHours()).toBe(2);
    });

    it('should handle minute selection', () => {
        const { getAllByText } = render(
            <TimePickerView
                selectedDate={initialDate}
                onTimeChange={mockOnTimeChange}
            />
        );

        // "05" is in Hour list and Minute list.
        const items = getAllByText('05');
        // Minute list is second.
        if (items.length > 1) {
            fireEvent.press(items[1]);
        } else {
            // Fallback
            fireEvent.press(items[0]);
        }

        expect(mockOnTimeChange).toHaveBeenCalled();
        const newDate = mockOnTimeChange.mock.calls[0][0];
        // 10:30 -> 10:05
        expect(newDate.getMinutes()).toBe(5);
    });
});
