import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from '../MainNavigator';

// Mock Screens to avoid rendering actual complex screens
jest.mock('../../screens/dashboard/DashboardScreen', () => {
    const { View, Text } = require('react-native');
    return () => <View><Text>Dashboard Mock</Text></View>;
});
jest.mock('../../screens/dashboard/ActivityScreen', () => {
    const { View, Text } = require('react-native');
    return () => <View><Text>Activity Mock</Text></View>;
});
jest.mock('../../screens/dashboard/ChatScreen', () => {
    const { View, Text } = require('react-native');
    return () => <View><Text>Chat Mock</Text></View>;
});
jest.mock('../../screens/dashboard/SettingsScreen', () => {
    const { View, Text } = require('react-native');
    return () => <View><Text>Settings Mock</Text></View>;
});
jest.mock('../../screens/DebugScreen', () => {
    const { View, Text } = require('react-native');
    return () => <View><Text>Debug Mock</Text></View>;
});

// Mock Icons
jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return {
        Home: (props) => <Text>Home-Icon</Text>,
        Activity: (props) => <Text>Activity-Icon</Text>,
        MessageCircle: (props) => <Text>MessageCircle-Icon</Text>,
        Settings: (props) => <Text>Settings-Icon</Text>,
        Terminal: (props) => <Text>Terminal-Icon</Text>,
    };
});

describe('MainNavigator', () => {
    it('should render all tabs', async () => {
        // We need NavigationContainer because MainNavigator gives a Tab.Navigator
        const { getByText, findAllByText } = render(
            <NavigationContainer>
                <MainNavigator />
            </NavigationContainer>
        );

        // Check for Tab Labels (Navigation default behavior uses route name as label if not specified, 
        // or we can check for screen content if focused)
        // By default, bottom tabs render all tab buttons.

        // Note: React Navigation 6/7 might be async or require more setup. 
        // But usually verifying existence of tab buttons or initial screen logic is good.

        // Verify initial screen is Dashboard (first in list)
        expect(getByText('Dashboard Mock')).toBeTruthy();

        // Verify Tab bar items exist (by label usually)
        // Note: `createBottomTabNavigator` renders labels by default.
        // We didn't explicitly suppress labels in screenOptions, so "Dashboard", "Activity", etc. should be visible.
        expect(getByText('Dashboard')).toBeTruthy();
        expect(getByText('Activity')).toBeTruthy();
        expect(getByText('Chat')).toBeTruthy();
        expect(getByText('Settings')).toBeTruthy();
        expect(getByText('Debug')).toBeTruthy();
    });
});

import { getTabBarIcon } from '../MainNavigator';

describe('getTabBarIcon', () => {
    const props = { color: 'red', size: 20 };

    it('should return correct icon for each route', () => {
        const { getByText: get1 } = render(getTabBarIcon('Dashboard', props));
        expect(get1('Home-Icon')).toBeTruthy();

        const { getByText: get2 } = render(getTabBarIcon('Activity', props));
        expect(get2('Activity-Icon')).toBeTruthy();

        const { getByText: get3 } = render(getTabBarIcon('Chat', props));
        expect(get3('MessageCircle-Icon')).toBeTruthy();

        const { getByText: get4 } = render(getTabBarIcon('Settings', props));
        expect(get4('Settings-Icon')).toBeTruthy();

        const { getByText: get5 } = render(getTabBarIcon('Debug', props));
        expect(get5('Terminal-Icon')).toBeTruthy();
    });

    it('should return default icon for unknown route', () => {
        const { getByText } = render(getTabBarIcon('UnknownRoute', props));
        expect(getByText('Home-Icon')).toBeTruthy();
    });
});
