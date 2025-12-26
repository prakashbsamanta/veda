import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { ActivityIndicator, View } from 'react-native';

export default function RootNavigator() {
    const { user, loading, initAuth } = useAuthStore();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        initAuth();
        // Allow time for initial auth check (short delay or until loading false)
        // Actually, initAuth sets up listener which updates loading.
        // We just need to trigger it.
        setIsReady(true);
    }, []);

    if (loading || !isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' }}>
                <ActivityIndicator size="large" color="#E5D0AC" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}
