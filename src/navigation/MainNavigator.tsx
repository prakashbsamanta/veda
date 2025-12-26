import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ActivityScreen from '../screens/dashboard/ActivityScreen';
import ChatScreen from '../screens/dashboard/ChatScreen';
import SettingsScreen from '../screens/dashboard/SettingsScreen';
import DebugScreen from '../screens/DebugScreen'; // Keep DebugScreen for now

import { Home, Activity, MessageCircle, Settings, Terminal } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList & { Debug: undefined }>();

export default function MainNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1C1C1E',
                    borderTopColor: '#2C2C2E',
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#E5D0AC',
                tabBarInactiveTintColor: '#666',
                tabBarIcon: ({ color, size, focused }) => {
                    switch (route.name) {
                        case 'Dashboard':
                            return <Home color={color} size={size} />;
                        case 'Activity':
                            return <Activity color={color} size={size} />;
                        case 'Chat':
                            return <MessageCircle color={color} size={size} />;
                        case 'Settings':
                            return <Settings color={color} size={size} />;
                        case 'Debug':
                            return <Terminal color={color} size={size} />;
                        default:
                            return <Home color={color} size={size} />;
                    }
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Activity" component={ActivityScreen} />
            <Tab.Screen name="Chat" component={ChatScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
            <Tab.Screen name="Debug" component={DebugScreen} />
        </Tab.Navigator>
    );
}
