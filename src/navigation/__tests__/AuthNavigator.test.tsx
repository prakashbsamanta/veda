import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from '../AuthNavigator';

// Mock Screens
jest.mock('../../screens/auth/LoginScreen', () => {
    const { View, Text } = require('react-native');
    return () => <View><Text>Login Mock</Text></View>;
});
jest.mock('../../screens/auth/SignupScreen', () => {
    const { View, Text } = require('react-native');
    return () => <View><Text>Signup Mock</Text></View>;
});

describe('AuthNavigator', () => {
    it('should render Login screen by default', async () => {
        const { getByText } = render(
            <NavigationContainer>
                <AuthNavigator />
            </NavigationContainer>
        );

        expect(getByText('Login Mock')).toBeTruthy();
    });
});
