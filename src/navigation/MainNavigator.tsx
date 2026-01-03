import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { MainTabParamList } from './types';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ActivityScreen from '../screens/dashboard/ActivityScreen';
import ChatScreen from '../screens/dashboard/ChatScreen';
import SettingsScreen from '../screens/dashboard/SettingsScreen';
import DebugScreen from '../screens/DebugScreen'; // Keep DebugScreen for now

import { Home, Activity, MessageCircle, Settings, Terminal } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList & { Debug: undefined }>();

export const getTabBarIcon = (routeName: string, { color, size }: { color: string; size: number }) => {
    switch (routeName) {
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
};



// ... imports ...

import AnimatedTabBar from './AnimatedTabBar';

// ...

export default function MainNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <AnimatedTabBar {...props} />}
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: (props) => getTabBarIcon(route.name, props),
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Activity" component={ActivityScreen} />
            <Tab.Screen name="Chat" component={ChatScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
            <Tab.Screen
                name="Debug"
                component={DebugScreen}
                options={{
                    tabBarButton: () => null
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
        elevation: 5,
        // Overflow hidden is important for borderRadius with BlurView on Android sometimes, 
        // but BlurView usually handles itself. 
        // Note: borderRadius on tabBarStyle applies to the container.
        // The BlurView needs to match the container's overflow or radius.
        overflow: 'hidden'
    }
});
