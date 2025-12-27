import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ChatScreen from '../ChatScreen';
import { cloudAIService } from '../../../services/ai/CloudAIService';
import { useAuthStore } from '../../../store/authStore';

// Mock Dependencies
jest.mock('../../../services/ai/CloudAIService', () => ({
    cloudAIService: {
        generateText: jest.fn(),
    }
}));

jest.mock('../../../store/authStore', () => ({
    useAuthStore: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return {
        Send: () => <Text>Send</Text>
    };
});

describe('ChatScreen', () => {
    const mockUser = { email: 'test@example.com' };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
        (cloudAIService.generateText as jest.Mock).mockResolvedValue({ text: 'AI Response' });
    });

    it('should result in welcome message', () => {
        const { getByText } = render(<ChatScreen />);
        expect(getByText(/Hello test!/)).toBeTruthy();
    });

    it('should send message and display response', async () => {
        const { getByPlaceholderText, getByText } = render(<ChatScreen />);

        const input = getByPlaceholderText('Ask anything...');
        fireEvent.changeText(input, 'Hello AI');

        const sendBtn = getByText('Send');
        fireEvent.press(sendBtn);

        await waitFor(() => {
            expect(getByText('Hello AI')).toBeTruthy(); // User message
            expect(cloudAIService.generateText).toHaveBeenCalledWith('Hello AI');
        });

        await waitFor(() => {
            expect(getByText('AI Response')).toBeTruthy(); // AI message
        });
    });

    it('should handle API errors', async () => {
        (cloudAIService.generateText as jest.Mock).mockRejectedValue(new Error('API Error'));
        const { getByPlaceholderText, getByText } = render(<ChatScreen />);

        const input = getByPlaceholderText('Ask anything...');
        fireEvent.changeText(input, 'Crash');
        fireEvent.press(getByText('Send'));

        await waitFor(() => {
            expect(getByText("I'm sorry, I encountered an error. Please try again.")).toBeTruthy();
        });
    });
    it('should use fallback name if no email', () => {
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { email: null } });
        const { getByText } = render(<ChatScreen />);
        expect(getByText(/Hello there!/)).toBeTruthy();
    });

    it('should not send empty message', () => {
        const { getByText } = render(<ChatScreen />);
        const sendBtn = getByText('Send');

        fireEvent.press(sendBtn);

        expect(cloudAIService.generateText).not.toHaveBeenCalled();
    });
});
