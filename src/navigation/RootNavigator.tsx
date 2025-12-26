import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ModelBrowserScreen from '../screens/settings/ModelBrowserScreen';
import { ActivityIndicator, View } from 'react-native';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { user, loading, initAuth } = useAuthStore();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        initAuth();
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
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                ) : (
                    <>
                        <Stack.Screen name="Main" component={MainNavigator} />
                        <Stack.Screen
                            name="ModelBrowser"
                            component={ModelBrowserScreen}
                            options={{ presentation: 'modal' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
