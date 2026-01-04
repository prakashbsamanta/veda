import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LogActivityModal from '../LogActivityModal';
import { activityService } from '../../services/database/ActivityService';
import { useAuthStore } from '../../store/authStore';
import { notificationService } from '../../services/notifications/NotificationService';
import { LocalCategorizer } from '../../services/ai/LocalCategorizer';

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

jest.mock('../../services/notifications/NotificationService', () => ({
    notificationService: {
        scheduleNotificationAtDate: jest.fn(),
    },
}));

jest.mock('../../services/ai/LocalCategorizer', () => ({
    LocalCategorizer: {
        suggestType: jest.fn(() => 'note'),
    },
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
        // Return 2025-01-01 10:00:00 as selected date
        const confirmDate = new Date(2025, 0, 1, 10, 0);
        return (
            <View testID="custom-date-picker">
                <Text>Confirm Date</Text>
                <TouchableOpacity onPress={() => props.onSelect(confirmDate)}>
                    <Text>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={props.onClose} testID="close-picker">
                    <Text>Close Picker</Text>
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
        (LocalCategorizer.suggestType as jest.Mock).mockReset();
        (LocalCategorizer.suggestType as jest.Mock).mockReturnValue('note');

        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: { uid: 'test-user-id' }
        });
        // Ensure createActivity resolves
        (activityService.createActivity as jest.Mock).mockResolvedValue(undefined);
    });

    // Mock LocalCategorizer
    jest.mock('../../services/ai/LocalCategorizer', () => ({
        LocalCategorizer: {
            suggestType: jest.fn(() => 'note'), // Default to note or whatever
        },
    }));

    // ... imports ...

    // ... inside describe ...

    it('should render correctly when visible', () => {
        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        expect(getByText('Log Activity')).toBeTruthy();
        expect(getByPlaceholderText("What's this about?")).toBeTruthy();
    });

    // ...

    it('should interact with date/time picker logic (Task with Future Date)', async () => {
        // Mock Timer to 2024
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01'));

        const { getByText, getByTestId, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        // Note -> Task
        fireEvent.press(getByText('Note'));

        // Verify type set
        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Future Task');

        const switchEl = getByTestId('reminder-switch');

        fireEvent(switchEl, 'valueChange', true);

        const dateBtn = getByTestId('date-picker-button');
        fireEvent.press(dateBtn);

        expect(getByText('Confirm Date')).toBeTruthy();
        fireEvent.press(getByText('Confirm')); // Returns 2025, which is > 2024

        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            // Check if save called first, to debug
            expect(activityService.createActivity).toHaveBeenCalled();

            // Check notification
            expect(notificationService.scheduleNotificationAtDate).toHaveBeenCalled();
        });

        jest.useRealTimers();
    });

    it('should handle past date for reminder (Task with Past Date)', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-01')); // 2026

        const { getByText, getByTestId, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        // Note -> Task
        fireEvent.press(getByText('Note'));

        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Past Task');
        const switchEl = getByTestId('reminder-switch');

        fireEvent(switchEl, 'valueChange', true);

        const dateBtn = getByTestId('date-picker-button');
        fireEvent.press(dateBtn);
        fireEvent.press(getByText('Confirm')); // Returns 2025 (< 2026)

        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            expect(activityService.createActivity).toHaveBeenCalled(); // Should still save!

            // Access children properly for "Warning"
            const titleNode = getByTestId('alert-title');

            // If we get an error, log it? We can't in expect.
            // If this expectation fails, it prints received value.
            expect(titleNode.props.children).toBe('Warning');
            expect(getByText('Reminder time is in the past, no notification set.')).toBeTruthy();
        });

        jest.useRealTimers();
    });

    it('should close date picker', () => {
        const { getByText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        // Note -> Task
        fireEvent.press(getByText('Note'));

        const switchEl = getByTestId('reminder-switch');
        fireEvent(switchEl, 'valueChange', true);
        fireEvent.press(getByTestId('date-picker-button'));

        expect(getByText('Confirm Date')).toBeTruthy();
        fireEvent.press(getByTestId('close-picker'));
    });

    it('should switch types correctly', () => {
        const { getByText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        // Initial is Note
        expect(getByText('Note')).toBeTruthy();

        // Note -> Task
        fireEvent.press(getByText('Note'));
        expect(getByText('Task')).toBeTruthy();

        // Task -> Expense
        fireEvent.press(getByText('Task'));
        expect(getByText('Expense')).toBeTruthy();

        // Expense -> Note
        fireEvent.press(getByText('Expense'));
        expect(getByText('Note')).toBeTruthy();
    });

    it('should validate empty title', () => {
        const { getByText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.press(getByText('Save Entry'));
        expect(getByTestId('alert-title').children[0]).toBe('Error');
        expect(getByText('Please enter a title')).toBeTruthy();
        expect(activityService.createActivity).not.toHaveBeenCalled();
    });

    it('should validate empty amount for expense', () => {
        (LocalCategorizer.suggestType as jest.Mock).mockReturnValue('expense');
        const { getByText, getByPlaceholderText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        // Note -> Task
        fireEvent.press(getByText('Note'));
        // Task -> Expense
        fireEvent.press(getByText('Task'));

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
        fireEvent.changeText(getByPlaceholderText('Add details (categories, tags, etc.)'), 'Test Desc');
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

    it('should save a valid task WITHOUT reminder', async () => {
        (LocalCategorizer.suggestType as jest.Mock).mockReturnValue('task');
        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        // Note -> Task
        fireEvent.press(getByText('Note'));

        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Simple Task');
        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            expect(activityService.createActivity).toHaveBeenCalledWith(
                'test-user-id',
                expect.objectContaining({
                    type: 'task',
                    title: 'Simple Task'
                })
            );
            expect(notificationService.scheduleNotificationAtDate).not.toHaveBeenCalled();
            expect(mockOnSave).toHaveBeenCalled();
        });
    });

    it('should update an existing activity', async () => {
        const initialActivity = {
            id: '123',
            type: 'note',
            title: 'Old Title',
            description: 'Old Desc',
            created_at: 123,
            updated_at: 123
        };

        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} initialActivity={initialActivity as any} />
        );

        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'New Title');
        fireEvent.press(getByText('Update Entry'));

        await waitFor(() => {
            expect(activityService.updateActivity).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    title: 'New Title'
                })
            );
            expect(mockOnSave).toHaveBeenCalled();
        });
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

        expect(getByTestId('alert-title').children[0]).toBe('Delete Activity');
        expect(getByText('Are you sure you want to delete this activity?')).toBeTruthy();

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

        const switchEl = getByTestId('reminder-switch');
        fireEvent(switchEl, 'valueChange', true);

        expect(queryByText(/Repeats/)).toBeNull();
    });
});
