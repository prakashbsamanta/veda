import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { authService } from '../../../services/auth/AuthService';

// Mock Dependencies
jest.mock('../../../services/auth/AuthService', () => ({
    authService: {
        signIn: jest.fn(),
    }
}));

// Helper to create navigation mock
const createTestProps = (props: Object = {}) => ({
    navigation: {
        navigate: jest.fn(),
    } as any,
    ...props
});

describe('LoginScreen', () => {
    let props: any;

    beforeEach(() => {
        jest.clearAllMocks();
        props = createTestProps();
    });

    it('should render correctly', () => {
        const { getByText, getByPlaceholderText } = render(<LoginScreen {...props} />);
        expect(getByText('Welcome Back')).toBeTruthy();
        expect(getByPlaceholderText('Enter your email')).toBeTruthy();
        expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    });

    it('should show error if fields are empty', async () => {
        const { getByText } = render(<LoginScreen {...props} />);

        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(getByText('Please fill in all fields')).toBeTruthy();
        });
        expect(authService.signIn).not.toHaveBeenCalled();
    });

    it('should call signIn with correct credentials', async () => {
        const { getByText, getByPlaceholderText } = render(<LoginScreen {...props} />);

        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    it('should handle sign in error', async () => {
        (authService.signIn as jest.Mock).mockRejectedValue({ code: 'auth/invalid-credential' });
        const { getByText, getByPlaceholderText } = render(<LoginScreen {...props} />);

        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'wrong@example.com');
        fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrongpass');
        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(getByText('Invalid email or password')).toBeTruthy();
        });
    });

    it('should handle invalid email error', async () => {
        (authService.signIn as jest.Mock).mockRejectedValue({ code: 'auth/invalid-email' });
        const { getByText, getByPlaceholderText } = render(<LoginScreen {...props} />);

        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'invalid');
        fireEvent.changeText(getByPlaceholderText('Enter your password'), 'pass');
        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(getByText('Invalid email format')).toBeTruthy();
        });
    });

    it('should handle generic error', async () => {
        (authService.signIn as jest.Mock).mockRejectedValue(new Error('Unknown'));
        const { getByText, getByPlaceholderText } = render(<LoginScreen {...props} />);

        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Enter your password'), 'pass');
        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(getByText('Failed to login')).toBeTruthy();
        });
    });

    it('should navigate to Signup', () => {
        const { getByText } = render(<LoginScreen {...props} />);

        fireEvent.press(getByText('Sign Up'));
        expect(props.navigation.navigate).toHaveBeenCalledWith('Signup');
    });
});
