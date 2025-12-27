import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';
import { activityService } from '../../../services/database/ActivityService';
import { authService } from '../../../services/auth/AuthService';
import { useAuthStore } from '../../../store/authStore';

// Mock removed

// Mock Dependencies
jest.mock('../../../services/database/ActivityService', () => ({
    activityService: {
        getRecentActivities: jest.fn(),
    }
}));

jest.mock('../../../services/auth/AuthService', () => ({
    authService: {
        signOut: jest.fn(),
    }
}));

jest.mock('../../../store/authStore', () => ({
    useAuthStore: jest.fn(),
}));

jest.mock('lottie-react-native', () => 'LottieView');

jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return {
        MessageCircle: () => <Text>MessageCircle</Text>,
        Activity: () => <Text>Activity</Text>,
        LogOut: () => <Text>LogOut</Text>
    };
});

// Mock LogActivityModal
jest.mock('../../../components/LogActivityModal', () => {
    const { View, Text } = require('react-native');
    return (props: any) => props.visible ? <View><Text>LogActivityModal Mock</Text></View> : null;
});

const createTestProps = (props: Object = {}) => ({
    navigation: {
        navigate: jest.fn(),
    } as any,
    ...props
});

describe('DashboardScreen', () => {
    let props: any;
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        props = createTestProps();
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
        (activityService.getRecentActivities as jest.Mock).mockResolvedValue([]);
    });

    // Helper to render with NavigationContainer
    const renderWithNav = (component: React.ReactNode) => {
        const { NavigationContainer } = require('@react-navigation/native');
        return render(<NavigationContainer>{component}</NavigationContainer>);
    };

    it('should render greeting and user name', () => {
        const { getByText } = renderWithNav(<DashboardScreen {...props} />);
        // 'User!' is fallback. Since we have email, we expect 'test!'
        expect(getByText('test!')).toBeTruthy();
    });

    it('should fetch and display recent activities', async () => {
        const mockData = [
            { id: '1', title: 'Test Note', type: 'note', created_at: new Date().toISOString() }
        ];
        (activityService.getRecentActivities as jest.Mock).mockResolvedValue(mockData);

        const { getByText } = renderWithNav(<DashboardScreen {...props} />);

        await waitFor(() => {
            // activityService.getRecentActivities is called by fetchActivities inside useFocusEffect
            // which runs on focus. NavigationContainer should trigger focus.
            expect(getByText('Test Note')).toBeTruthy();
        });
    });

    it('should handle navigation buttons', () => {
        const { getByText } = renderWithNav(<DashboardScreen {...props} />);

        fireEvent.press(getByText('Ask Veda'));
        expect(props.navigation.navigate).toHaveBeenCalledWith('Chat');

        fireEvent.press(getByText('See All'));
        expect(props.navigation.navigate).toHaveBeenCalledWith('Activity');
    });

    it('should toggle activity modal', () => {
        const { getByText, queryByText } = renderWithNav(<DashboardScreen {...props} />);

        expect(queryByText('LogActivityModal Mock')).toBeNull();

        fireEvent.press(getByText('Log Activity'));
        expect(getByText('LogActivityModal Mock')).toBeTruthy();
    });

    it('should handle logout', async () => {
        const { getByText } = renderWithNav(<DashboardScreen {...props} />);

        fireEvent.press(getByText('LogOut'));

        await waitFor(() => {
            expect(authService.signOut).toHaveBeenCalled();
        });
    });

    it('should greet Good Morning before 12 PM', () => {
        jest.useFakeTimers({ now: new Date('2023-01-01T09:00:00') });

        const { getByText } = renderWithNav(<DashboardScreen {...props} />);
        expect(getByText('Good Morning,')).toBeTruthy();

        jest.useRealTimers();
    });

    it('should greet Good Afternoon between 12 PM and 6 PM', () => {
        jest.useFakeTimers({ now: new Date('2023-01-01T14:00:00') });

        const { getByText } = renderWithNav(<DashboardScreen {...props} />);
        expect(getByText('Good Afternoon,')).toBeTruthy();

        jest.useRealTimers();
    });

    it('should greet Good Evening after 6 PM', () => {
        jest.useFakeTimers({ now: new Date('2023-01-01T20:00:00') });

        const { getByText } = renderWithNav(<DashboardScreen {...props} />);
        expect(getByText('Good Evening,')).toBeTruthy();

        jest.useRealTimers();
    });

    it('should handle logout error', async () => {
        // Mock console.error to suppress expected error output in test log
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (authService.signOut as jest.Mock).mockRejectedValue(new Error('Logout Failed'));
        const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

        const { getByText } = renderWithNav(<DashboardScreen {...props} />);
        fireEvent.press(getByText('LogOut'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith("Error", "Failed to log out");
        });
        consoleSpy.mockRestore();
    });

    it('should render various activity types correctly', async () => {
        const mockData = [
            { id: '1', title: 'Task Item', type: 'task', created_at: new Date().toISOString() },
            { id: '2', title: 'Expense Item', type: 'expense', amount: 50, currency: 'USD', created_at: new Date().toISOString() }
        ];
        (activityService.getRecentActivities as jest.Mock).mockResolvedValue(mockData);

        const { getByText } = renderWithNav(<DashboardScreen {...props} />);

        await waitFor(() => {
            expect(getByText('Task Item')).toBeTruthy();
            expect(getByText('Expense Item')).toBeTruthy();
            expect(getByText('-USD 50')).toBeTruthy();
        });
    });

    it('should show empty state when no activities', async () => {
        (activityService.getRecentActivities as jest.Mock).mockResolvedValue([]);
        const { getByText } = renderWithNav(<DashboardScreen {...props} />);

        await waitFor(() => {
            expect(getByText('Your daily summary will appear here.')).toBeTruthy();
        });
    });

    it('should fallback user name if email is missing', () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { ...mockUser, email: null } });
        const { getByText } = renderWithNav(<DashboardScreen {...props} />);
        expect(getByText('User!')).toBeTruthy();
    });
});
