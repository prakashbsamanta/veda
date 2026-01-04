import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import ChatScreen from '../ChatScreen';
import { cloudAIService } from '../../../services/ai/CloudAIService';
import { useAuthStore } from '../../../store/authStore';
import { Audio } from 'expo-av';

// Mock Dependencies
jest.mock('../../../services/ai/CloudAIService', () => ({
    cloudAIService: {
        generateText: jest.fn(),
        generateResponseFromAudio: jest.fn(),
    }
}));

jest.mock('../../../store/authStore', () => ({
    useAuthStore: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return {
        Send: () => <Text>Send</Text>,
        Mic: () => <Text>Mic</Text>,
        Square: () => <Text>Stop</Text>,
    };
});

// Mock Expo Modules
jest.mock('expo-av', () => ({
    Audio: {
        requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
        setAudioModeAsync: jest.fn(),
        Recording: {
            createAsync: jest.fn(),
        },
        RecordingOptionsPresets: {
            HIGH_QUALITY: {},
        }
    }
}));

jest.mock('expo-speech', () => ({
    speak: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
    readAsStringAsync: jest.fn().mockResolvedValue('base64audio'),
    EncodingType: { Base64: 'base64' },
}));


describe('ChatScreen', () => {
    const mockUser = { email: 'test@example.com' };
    let mockRecording: any;

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
        (cloudAIService.generateText as jest.Mock).mockResolvedValue({ text: 'AI Response' });
        (cloudAIService.generateResponseFromAudio as jest.Mock).mockResolvedValue({ text: 'Audio Response' });
        (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

        // Setup recording mock per test
        mockRecording = {
            stopAndUnloadAsync: jest.fn(),
            getURI: jest.fn().mockReturnValue('file://test.m4a'),
        };
        (Audio.Recording.createAsync as jest.Mock).mockResolvedValue({ recording: mockRecording });
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

    it('should handle audio recording flow', async () => {
        const { getByText, getByPlaceholderText } = render(<ChatScreen />);
        const micBtn = getByText('Mic');

        // Start Recording
        await act(async () => {
            fireEvent(micBtn, 'pressIn');
        });

        expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
        expect(Audio.Recording.createAsync).toHaveBeenCalled();
        expect(getByPlaceholderText('Listening...')).toBeTruthy();

        // Re-query button to get the updated handler with new state
        const micBtnActive = getByText('Stop');

        // Stop Recording
        await act(async () => {
            fireEvent(micBtnActive, 'pressOut');
        });

        expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalled();

        await waitFor(() => {
            expect(cloudAIService.generateResponseFromAudio).toHaveBeenCalledWith('base64audio');
            expect(getByText('Audio Response')).toBeTruthy();
        });
    });
    it('should handle permission denied', async () => {
        (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
        const { getByText, getByPlaceholderText } = render(<ChatScreen />);
        const micBtn = getByText('Mic');

        await act(async () => {
            fireEvent(micBtn, 'pressIn');
        });

        // Should show alert (mocked/spy needed usually, but logic stops before recording)
        expect(Audio.Recording.createAsync).not.toHaveBeenCalled();
    });

    it('should handle start recording error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        (Audio.Recording.createAsync as jest.Mock).mockRejectedValue(new Error('Start Error'));
        const { getByText } = render(<ChatScreen />);
        const micBtn = getByText('Mic');

        await act(async () => {
            fireEvent(micBtn, 'pressIn');
        });

        expect(consoleSpy).toHaveBeenCalledWith('Failed to start recording', expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should handle stop recording/processing error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const { getByText } = render(<ChatScreen />);
        const micBtn = getByText('Mic');

        // Start
        await act(async () => {
            fireEvent(micBtn, 'pressIn');
        });

        // Fail the stop step (e.g. analysis failure)
        (cloudAIService.generateResponseFromAudio as jest.Mock).mockRejectedValue(new Error('Analysis Failed'));

        const micBtnActive = getByText('Stop');
        await act(async () => {
            fireEvent(micBtnActive, 'pressOut');
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Recording/Analysis failed', expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    it('should cleanup recording on unmount', async () => {
        const { getByText, unmount } = render(<ChatScreen />);
        const micBtn = getByText('Mic');

        await act(async () => {
            fireEvent(micBtn, 'pressIn');
        });

        unmount();

        expect(mockRecording.stopAndUnloadAsync).toHaveBeenCalled();
    });
});
