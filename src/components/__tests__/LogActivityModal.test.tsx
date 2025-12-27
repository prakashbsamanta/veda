import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LogActivityModal from '../LogActivityModal';
import { activityService } from '../../services/database/ActivityService';
import { notificationService } from '../../services/notifications/NotificationService';
import { useAuthStore } from '../../store/authStore';
import { Alert } from 'react-native';

// Mock Dependencies
jest.mock('lucide-react-native', () => ({
    X: 'X', Check: 'Check', FileText: 'FileText',
    CheckSquare: 'CheckSquare', DollarSign: 'DollarSign',
    Plus: 'Plus', AlarmClock: 'AlarmClock'
}));

jest.mock('../../services/database/ActivityService', () => ({
    activityService: {
        createActivity: jest.fn(),
    }
}));

jest.mock('../../services/notifications/NotificationService', () => ({
    notificationService: {
        scheduleNotificationAtDate: jest.fn(),
    }
}));

jest.mock('../../store/authStore', () => ({
    useAuthStore: jest.fn(),
}));

jest.mock('@react-native-community/datetimepicker', () => {
    const { View, Button } = require('react-native');
    const MockDateTimePicker = (props: any) => {
        return (
            <View testID="mock-datepicker">
                <Button
                    title="Confirm Date"
                    onPress={() => props.onChange({ type: 'set' }, new Date('2025-12-25T10:00:00'))}
                />
            </View>
        );
    };
    return MockDateTimePicker;
});

// Spy on Alert
jest.spyOn(Alert, 'alert');

describe('LogActivityModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();
    const mockUser = { uid: 'test-uid' };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
    });

    it('should render correctly when visible', () => {
        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        expect(getByText('Log New Activity')).toBeTruthy();
        expect(getByPlaceholderText("What's this about?")).toBeTruthy();
    });

    it('should validate empty title', async () => {
        const { getByText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.press(getByText('Save Entry'));

        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a title');
        expect(activityService.createActivity).not.toHaveBeenCalled();
    });

    it('should validate empty amount for expense', () => {
        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.press(getByText('Expense'));
        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Dinner');
        fireEvent.press(getByText('Save Entry'));

        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter an amount');
    });

    it('should save a valid note activity', async () => {
        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Meeting');
        fireEvent.changeText(getByPlaceholderText("Add details (optional)"), 'Discuss project');

        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            expect(activityService.createActivity).toHaveBeenCalledWith('test-uid', {
                type: 'note',
                title: 'Meeting',
                description: 'Discuss project',
                amount: undefined,
                currency: 'INR'
            });
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
        fireEvent.changeText(getByPlaceholderText("0.00"), '500');

        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            expect(activityService.createActivity).toHaveBeenCalledWith('test-uid', {
                type: 'expense',
                title: 'Lunch',
                description: '',
                amount: 500,
                currency: 'INR'
            });
        });
    });

    it('should handle task with reminder', async () => {
        const { getByText, getByPlaceholderText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.press(getByText('Task'));
        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Call Mom');

        const switchEl = getByTestId('reminder-switch');
        fireEvent(switchEl, 'valueChange', true);

        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            expect(activityService.createActivity).toHaveBeenCalledWith('test-uid', expect.objectContaining({
                type: 'task',
                title: 'Call Mom'
            }));
        });
    });

    it('should handle save error', async () => {
        (activityService.createActivity as jest.Mock).mockRejectedValue(new Error('Save Failed'));
        const { getByText, getByPlaceholderText } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.changeText(getByPlaceholderText("What's this about?"), 'Error Note');
        fireEvent.press(getByText('Save Entry'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save activity');
        });
    });

    it('should interact with date/time picker logic', () => {
        const { getByText, getByTestId } = render(
            <LogActivityModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
        );

        fireEvent.press(getByText('Task'));
        fireEvent(getByTestId('reminder-switch'), 'valueChange', true);

        const dateBtn = getByText(/at/);
        fireEvent.press(dateBtn);

        const confirmBtn = getByText('Confirm Date');
        fireEvent.press(confirmBtn);

        fireEvent.press(getByText('Confirm Date')); // Confirm Time
    });
});
