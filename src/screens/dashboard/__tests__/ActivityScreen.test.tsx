import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ActivityScreen from '../ActivityScreen';
import { activityService } from '../../../services/database/ActivityService';
import { useAuthStore } from '../../../store/authStore';

// Mock Dependencies
// Mock removed

jest.mock('../../../services/database/ActivityService', () => ({
    activityService: {
        getRecentActivities: jest.fn(),
        deleteActivity: jest.fn(),
    }
}));

jest.mock('../../../store/authStore', () => ({
    useAuthStore: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return {
        Trash2: () => <Text>Trash2</Text>,
        FileText: () => <Text>FileText</Text>,
        CheckSquare: () => <Text>CheckSquare</Text>,
        DollarSign: () => <Text>DollarSign</Text>,
        Plus: () => <Text>Plus</Text>
    };
});

jest.mock('../../../components/LogActivityModal', () => {
    const { View, Text, Button } = require('react-native');
    return (props: any) => props.visible ? (
        <View>
            <Text>LogActivityModal Mock</Text>
            <Button title="Close Modal" onPress={props.onClose} />
        </View>
    ) : null;
});

describe('ActivityScreen', () => {
    const mockUser = { uid: 'test-user' };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
        (activityService.getRecentActivities as jest.Mock).mockResolvedValue([]);
    });

    // Helper to render with NavigationContainer
    const renderWithNav = (component: React.ReactNode) => {
        const { NavigationContainer } = require('@react-navigation/native');
        return render(<NavigationContainer>{component}</NavigationContainer>);
    };

    it('should render header and empty state', () => {
        const { getByText } = renderWithNav(<ActivityScreen />);
        expect(getByText('Activity History')).toBeTruthy();
        expect(getByText('No activities logged yet.')).toBeTruthy();
    });

    it('should fetch and display activities', async () => {
        const mockActivities = [
            { id: '1', type: 'note', title: 'Test Note', created_at: new Date().toISOString() },
            { id: '2', type: 'expense', title: 'Lunch', amount: 20, currency: 'USD', created_at: new Date().toISOString() },
        ];
        (activityService.getRecentActivities as jest.Mock).mockResolvedValue(mockActivities);

        const { getByText, findAllByText } = renderWithNav(<ActivityScreen />);

        await waitFor(() => {
            expect(getByText('Test Note')).toBeTruthy();
            expect(getByText('Lunch')).toBeTruthy();
            // Check for amount display
            expect(getByText('-USD 20')).toBeTruthy();
        });
    });

    it('should handle delete activity', async () => {
        const mockActivities = [
            { id: '1', type: 'note', title: 'Delete Me', created_at: new Date().toISOString() },
        ];
        (activityService.getRecentActivities as jest.Mock).mockResolvedValue(mockActivities);

        const { getByText, getAllByText } = renderWithNav(<ActivityScreen />);

        await waitFor(() => expect(getByText('Delete Me')).toBeTruthy());

        // Find delete button (Trash2 icon)
        const deleteButtons = getAllByText('Trash2');
        fireEvent.press(deleteButtons[0]);

        await waitFor(() => {
            expect(activityService.deleteActivity).toHaveBeenCalledWith('1');
            // Should reload activities
            expect(activityService.getRecentActivities).toHaveBeenCalledTimes(2); // Initial + After delete
        });
    });

    it('should show modal on add button press', () => {
        const { getByText } = renderWithNav(<ActivityScreen />);

        fireEvent.press(getByText('Plus'));
        expect(getByText('LogActivityModal Mock')).toBeTruthy();
    });
    it('should handle delete error', async () => {
        const mockActivities = [
            { id: '1', type: 'note', title: 'Delete Error', created_at: new Date().toISOString() },
        ];
        (activityService.getRecentActivities as jest.Mock).mockResolvedValue(mockActivities);
        (activityService.deleteActivity as jest.Mock).mockRejectedValue(new Error('Delete Failed'));

        const { getByText, getAllByText } = renderWithNav(<ActivityScreen />);

        await waitFor(() => expect(getByText('Delete Error')).toBeTruthy());

        const deleteButtons = getAllByText('Trash2');
        fireEvent.press(deleteButtons[0]);

        // Mock Alert
        jest.spyOn(require('react-native').Alert, 'alert');

        await waitFor(() => {
            expect(require('react-native').Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete');
        });
    });

    it('should close modal', async () => {
        const { getByText, queryByText } = renderWithNav(<ActivityScreen />);

        fireEvent.press(getByText('Plus'));
        expect(getByText('LogActivityModal Mock')).toBeTruthy();

        fireEvent.press(getByText('Close Modal'));

        await waitFor(() => {
            expect(queryByText('LogActivityModal Mock')).toBeNull();
        });
    });
    it('should handle different item types and missing descriptions', async () => {
        const mockActivities = [
            { id: '1', type: 'task', title: 'Task Item', created_at: new Date().toISOString() }, // Task type
            { id: '2', type: 'note', title: 'Note No Desc', description: null, created_at: new Date().toISOString() }, // No description
            { id: '3', type: 'expense', title: 'Expense Desc', description: 'Bought stuff', amount: 50, currency: 'USD', created_at: new Date().toISOString() }, // With description
        ];
        (activityService.getRecentActivities as jest.Mock).mockResolvedValue(mockActivities);

        const { getByText } = renderWithNav(<ActivityScreen />);

        await waitFor(() => {
            expect(getByText('Task Item')).toBeTruthy();
            expect(getByText('Note No Desc')).toBeTruthy();
            expect(getByText('Bought stuff')).toBeTruthy();
        });
    });

    it('should not fetch activities if user is null', async () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: null });
        renderWithNav(<ActivityScreen />);

        expect(activityService.getRecentActivities).not.toHaveBeenCalled();
    });
});

