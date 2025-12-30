import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LogActivityModal from '../LogActivityModal';
import { activityService } from '../../services/database/ActivityService';
import { useAuthStore } from '../../store/authStore';

// Mock dependencies
jest.mock('../../services/database/ActivityService', () => ({
    activityService: {
        createActivity: jest.fn(),
        updateActivity: jest.fn(),
        deleteActivity: jest.fn(),
    },
}));

jest.mock('../../store/authStore', () => ({
    useAuthStore: jest.fn(),
}));

jest.mock('lucide-react-native', () => ({
    X: 'X', Check: 'Check', FileText: 'FileText',
    CheckSquare: 'CheckSquare', DollarSign: 'DollarSign',
    Plus: 'Plus', AlarmClock: 'AlarmClock',
    Activity: 'Activity',
    Trash: 'Trash',
    Repeat: 'Repeat',
    ChevronRight: 'ChevronRight',
    ChevronLeft: 'ChevronLeft'
}));

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

jest.mock('expo-device', () => ({
    isDevice: true,
    osName: 'iOS',
}));

// Mock CustomAlertModal
jest.mock('../../components/common/CustomAlertModal', () => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return ({ visible, title, message, buttons, onClose }: any) => {
        if (!visible) return null;
        return (
            <View testID="custom-alert-modal">
                <Text testID="alert-title">{title}</Text>
                {message && <Text>{message}</Text>}
                {buttons && buttons.map((btn: any, idx: number) => (
                    <TouchableOpacity key={idx} testID={`alert-button-${idx}`} onPress={btn.onPress}>
                        <Text>{btn.text}</Text>
                    </TouchableOpacity>
                ))}
                {!buttons && (
                    <TouchableOpacity onPress={onClose}><Text>OK</Text></TouchableOpacity>
                )}
            </View>
        );
    };
});

// Mock CustomDatePickerModal
jest.mock('../../components/common/CustomDatePickerModal', () => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (props: any) => {
        if (!props.visible) return null;
        return (
            <View testID="custom-date-picker">
                <Text>Confirm Date</Text>
                <TouchableOpacity onPress={() => props.onSelect(new Date())}>
                    <Text>Confirm</Text>
                </TouchableOpacity>
            </View>
        );
    };
});

describe('LogActivityModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: { uid: 'test-user-id' }
        });
    });

    it('should render correctly when visible', () => {
        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        expect(getByText('Log New Activity')).toBeTruthy();
        expect(getByPlaceholderText("What's this about?")).toBeTruthy();
    });

    it('should validate empty title', () => {
        const { getByText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.press(getByText('Save Entry'));
        expect(getByTestId('alert-title').children[0]).toBe('Error'); // Check alert title specifically
        expect(getByText('Please enter a title')).toBeTruthy();
        expect(activityService.createActivity).not.toHaveBeenCalled();
    });

    it('should validate empty amount for expense', () => {
        const { getByText, getByPlaceholderText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.press(getByText('Expense'));
        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Test Expense');
        fireEvent.press(getByText('Save Entry'));

        expect(getByTestId('alert-title').children[0]).toBe('Error');
        expect(getByText('Please enter an amount')).toBeTruthy();
    });

    it('should save a valid note activity', async () => {
        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Test Note');
        fireEvent.changeText(getByPlaceholderText('Add details (optional)'), 'Test Desc');
        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            expect(activityService.createActivity).toHaveBeenCalledWith(
                'test-user-id',
                expect.objectContaining({
                    type: 'note',
                    title: 'Test Note',
                    description: 'Test Desc'
                })
            );
            expect(mockOnSave).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('should save a valid expense activity', async () => {
        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.press(getByText('Expense'));
        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Lunch');
        fireEvent.changeText(getByPlaceholderText('0.00'), '20');
        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            expect(activityService.createActivity).toHaveBeenCalledWith(
                'test-user-id',
                expect.objectContaining({
                    type: 'expense',
                    title: 'Lunch',
                    amount: 20
                })
            );
        });
    });

    it('should handle save error', async () => {
        (activityService.createActivity as jest.Mock).mockRejectedValue(new Error('Save failed'));

        const { getByText, getByPlaceholderText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Fail Note');
        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            expect(getByTestId('alert-title').children[0]).toBe('Error'); // Check alert
            expect(getByText('Failed to save activity')).toBeTruthy();
        });
    });

    it('should interact with date/time picker logic', () => {
        const { getByText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.press(getByText('Task'));
        const switchEl = getByTestId('reminder-switch');
        fireEvent(switchEl, 'valueChange', true);

        const dateBtn = getByText(/at/);
        fireEvent.press(dateBtn);

        expect(getByText('Confirm Date')).toBeTruthy();
        fireEvent.press(getByText('Confirm'));
    });

    it('should handle delete activity', async () => {
        const initialActivity = {
            id: '123',
            type: 'note',
            title: 'Delete Me',
            created_at: 123,
            updated_at: 123
        };

        const { getByText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} initialActivity={initialActivity as any} />
        );

        const deleteBtn = getByText('Delete Activity');
        fireEvent.press(deleteBtn);

        // Ambiguity fix: Check for alert title specifically using testID
        expect(getByTestId('alert-title').children[0]).toBe('Delete Activity');
        expect(getByText('Are you sure you want to delete this activity?')).toBeTruthy();

        // Confirm delete (mock alert renders custom buttons)
        fireEvent.press(getByText('Delete'));

        await waitFor(() => {
            expect(activityService.deleteActivity).toHaveBeenCalledWith('123');
            expect(mockOnSave).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('should handle delete failure', async () => {
        (activityService.deleteActivity as jest.Mock).mockRejectedValue(new Error('Delete invalid'));
        const initialActivity = {
            id: '123',
            type: 'note',
            title: 'Delete Me'
        };

        const { getByText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} initialActivity={initialActivity as any} />
        );

        fireEvent.press(getByText('Delete Activity'));
        fireEvent.press(getByText('Delete'));

        await waitFor(() => {
            expect(getByTestId('alert-title').children[0]).toBe('Error');
            expect(getByText('Failed to delete activity')).toBeTruthy();
        });
    });

    it('should parse existing recurrent activity', () => {
        const initial = {
            id: '1', type: 'task', title: 'Recurring', recurrence_rule: '{"frequency":"daily"}'
        };

        const { getByText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} initialActivity={initial as any} />
        );

        // Fix: Reminder defaults to false on edit, so we must toggle it to see recurrence
        const switchEl = getByTestId('reminder-switch');
        fireEvent(switchEl, 'valueChange', true);

        expect(getByText(/daily/i)).toBeTruthy();
    });

    it('should handle malformed recurrence rule', () => {
        const initial = {
            id: '1', type: 'task', title: 'Bad JSON', recurrence_rule: '{badjson'
        };

        const { queryByText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} initialActivity={initial as any} />
        );

        // Toggle reminder
        const switchEl = getByTestId('reminder-switch');
        fireEvent(switchEl, 'valueChange', true);

        // Recurrence rule undefined -> text shouldn't show "Repeats"
        expect(queryByText(/Repeats/)).toBeNull();
    });
});
