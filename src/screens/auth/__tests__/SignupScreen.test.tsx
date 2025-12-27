import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import SignupScreen from '../SignupScreen';
import { authService } from '../../../services/auth/AuthService';

// Mock Dependencies
jest.mock('../../../services/auth/AuthService', () => ({
    authService: {
        signUp: jest.fn(),
    }
}));

const createTestProps = (props: Object = {}) => ({
    navigation: {
        navigate: jest.fn(),
    } as any,
    ...props
});

describe('SignupScreen', () => {
    let props: any;

    beforeEach(() => {
        jest.clearAllMocks();
        props = createTestProps();
    });

    it('should render correctly', () => {
        const { getByText, getByPlaceholderText } = render(<SignupScreen {...props} />);
        expect(getByText('Create Account')).toBeTruthy();
        expect(getByPlaceholderText('Enter your full name')).toBeTruthy();
    });

    it('should validate empty fields', async () => {
        const { getByText } = render(<SignupScreen {...props} />);
        fireEvent.press(getByText('Sign Up'));
        await waitFor(() => {
            expect(getByText('Please fill in all fields')).toBeTruthy();
        });
    });

    it('should validate password mismatch', async () => {
        const { getByText, getByPlaceholderText } = render(<SignupScreen {...props} />);

        fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
        fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'mismatch');

        fireEvent.press(getByText('Sign Up'));

        await waitFor(() => {
            expect(getByText('Passwords do not match')).toBeTruthy();
        });
    });

    it('should validate weak password', async () => {
        const { getByText, getByPlaceholderText } = render(<SignupScreen {...props} />);

        fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Create a password'), '123');
        fireEvent.changeText(getByPlaceholderText('Confirm your password'), '123');

        fireEvent.press(getByText('Sign Up'));

        await waitFor(() => {
            expect(getByText('Password must be at least 6 characters')).toBeTruthy();
        });
    });

    it('should call signUp with valid data', async () => {
        const { getByText, getByPlaceholderText } = render(<SignupScreen {...props} />);

        fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
        fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

        fireEvent.press(getByText('Sign Up'));

        await waitFor(() => {
            expect(authService.signUp).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    it('should navigate to Login', () => {
        const { getByText } = render(<SignupScreen {...props} />);
        fireEvent.press(getByText('Log In'));
        expect(props.navigation.navigate).toHaveBeenCalledWith('Login');
    });
    it('should handle email already in use', async () => {
        (authService.signUp as jest.Mock).mockRejectedValue({ code: 'auth/email-already-in-use' });
        const { getByText, getByPlaceholderText } = render(<SignupScreen {...props} />);

        fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
        fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

        fireEvent.press(getByText('Sign Up'));

        await waitFor(() => {
            expect(getByText('Email already in use')).toBeTruthy();
        });
    });

    it('should handle invalid email format', async () => {
        (authService.signUp as jest.Mock).mockRejectedValue({ code: 'auth/invalid-email' });
        const { getByText, getByPlaceholderText } = render(<SignupScreen {...props} />);

        // Fill valid inputs to pass frontend validation
        fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'invalid');
        fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
        fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

        fireEvent.press(getByText('Sign Up'));

        await waitFor(() => {
            expect(getByText('Invalid email format')).toBeTruthy();
        });
    });

    it('should handle obscure auth error', async () => {
        (authService.signUp as jest.Mock).mockRejectedValue(new Error('Unknown'));
        const { getByText, getByPlaceholderText } = render(<SignupScreen {...props} />);

        fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
        fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

        fireEvent.press(getByText('Sign Up'));

        await waitFor(() => {
            expect(getByText('Failed to create account')).toBeTruthy();
        });
    });
});
