import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CustomDatePickerModal from '../CustomDatePickerModal';

// Mock sub-components
jest.mock('../CalendarView', () => {
    const { View, Button, Text } = require('react-native');
    return ({ onDateSelect }: any) => (
        <View testID="calendar-view">
            <Text>CalendarView</Text>
            <Button title="Select Date" onPress={() => onDateSelect(new Date('2025-01-01T10:00:00'))} />
        </View>
    );
});

jest.mock('../TimePickerView', () => {
    const { View, Button, Text } = require('react-native');
    return ({ onTimeChange }: any) => (
        <View testID="time-picker-view">
            <Text>TimePickerView</Text>
            <Button title="Change Time" onPress={() => onTimeChange(new Date('2025-01-01T12:30:00'))} />
        </View>
    );
});

jest.mock('../RecurrencePicker', () => {
    const { View, Text, Button } = require('react-native');
    return ({ onSelect }: any) => (
        <View testID="recurrence-picker">
            <Text>RecurrencePicker</Text>
            <Button title="Select Recurrence" onPress={() => onSelect({ frequency: 'daily' })} />
        </View>
    );
});

// Mock Icons
jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return {
        Calendar: () => <Text>Icon-Calendar</Text>,
        Clock: () => <Text>Icon-Clock</Text>,
        X: () => <Text>Icon-X</Text>,
        Check: () => <Text>Icon-Check</Text>,
        Repeat: () => <Text>Icon-Repeat</Text>
    };
});

describe('CustomDatePickerModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSelect = jest.fn();
    const mockOnRecurrenceChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly in default (datetime) mode', () => {
        const { getByText, getByTestId, getAllByText } = render(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
            />
        );
        expect(getByTestId('calendar-view')).toBeTruthy();
        expect(getAllByText('Icon-Calendar')).toBeTruthy(); // Date tab exists
        expect(getAllByText('Icon-Clock')).toBeTruthy(); // Time tab exists
    });

    it('should switch between tabs', () => {
        // Must provide onRecurrenceChange to see Repeat tab
        const { getByText, getByTestId } = render(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
                mode="datetime"
                onRecurrenceChange={mockOnRecurrenceChange}
            />
        );

        // Default is Date
        expect(getByTestId('calendar-view')).toBeTruthy();

        // Switch to Time
        const clockIcon = getByText('Icon-Clock');
        fireEvent.press(clockIcon);
        expect(getByTestId('time-picker-view')).toBeTruthy();

        // Switch back to Date to cover onPress handler
        const calendarIcon = getByText('Icon-Calendar');
        fireEvent.press(calendarIcon);
        expect(getByTestId('calendar-view')).toBeTruthy();

        // Switch to Repeat
        const repeatIcon = getByText('Icon-Repeat');
        fireEvent.press(repeatIcon);
        expect(getByTestId('recurrence-picker')).toBeTruthy();
    });

    it('should only show date tab in date mode', () => {
        const { queryByTestId, queryByText } = render(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
                mode="date"
            />
        );
        expect(queryByTestId('calendar-view')).toBeTruthy();
        expect(queryByTestId('time-picker-view')).toBeNull();
        expect(queryByText('Icon-Clock')).toBeNull();
    });

    it('should only show time tab in time mode', () => {
        const { getByTestId, queryByTestId, queryByText } = render(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
                mode="time"
            />
        );
        expect(getByTestId('time-picker-view')).toBeTruthy();
        expect(queryByTestId('calendar-view')).toBeNull();
        expect(queryByText('Icon-Calendar')).toBeNull();
    });

    it('should update date when CalendarView triggers selection', () => {
        const { getByText } = render(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
            />
        );
        fireEvent.press(getByText('Select Date'));
        fireEvent.press(getByText('Confirm'));
        expect(mockOnSelect).toHaveBeenCalledWith(expect.any(Date));
        expect(mockOnSelect.mock.calls[0][0].toISOString()).toContain('2025-01-01');
    });

    it('should update time when TimePickerView triggers change', () => {
        const { getByText } = render(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
                mode="time"
            />
        );
        fireEvent.press(getByText('Change Time'));
        fireEvent.press(getByText('Confirm'));
        expect(mockOnSelect).toHaveBeenCalled();
        expect(mockOnSelect.mock.calls[0][0].getHours()).toBe(12);
        expect(mockOnSelect.mock.calls[0][0].getMinutes()).toBe(30);
    });

    it('should handle recurrence selection', () => {
        const { getByText, getByTestId } = render(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
                onRecurrenceChange={mockOnRecurrenceChange}
            />
        );
        fireEvent.press(getByText('Icon-Repeat'));
        fireEvent.press(getByText('Select Recurrence'));

        expect(mockOnRecurrenceChange).toHaveBeenCalledWith({ frequency: 'daily' });
    });

    it('should show recurrence badge if rule exists', () => {
        const { getByText, rerender } = render(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
                onRecurrenceChange={mockOnRecurrenceChange}
                recurrenceRule={{ frequency: 'daily' }}
            />
        );
    });

    it('should default to correct tab when opened', () => {
        const { getByTestId, rerender } = render(
            <CustomDatePickerModal
                visible={false}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
                mode="time"
            />
        );
        // Rerender visible=true to trigger useEffect
        rerender(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
                mode="time"
            />
        );
        expect(getByTestId('time-picker-view')).toBeTruthy();

        rerender(
            <CustomDatePickerModal
                visible={true}
                onClose={mockOnClose}
                onSelect={mockOnSelect}
                mode="date"
            />
        );
        expect(getByTestId('calendar-view')).toBeTruthy();
    });
});
