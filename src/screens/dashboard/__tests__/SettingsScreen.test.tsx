import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { authService } from '../../../services/auth/AuthService';

// Mock Dependencies
jest.mock('../../../store/authStore', () => ({
    useAuthStore: jest.fn(),
}));

// Mock simple version of Zustand store
const mockSetProvider = jest.fn();
const mockSetOpenRouterKey = jest.fn();
const mockSetGeminiKey = jest.fn();
const mockSetPerplexityKey = jest.fn();

jest.mock('../../../store/settingsStore', () => ({
    useSettingsStore: jest.fn(),
}));

// Assign static methods to the mock if they are used via useSettingsStore.getState()
(useSettingsStore as any).getState = () => ({
    geminiKey: '',
    perplexityKey: '',
    setGeminiKey: mockSetGeminiKey,
    setPerplexityKey: mockSetPerplexityKey
});

jest.mock('../../../services/auth/AuthService', () => ({
    authService: {
        signOut: jest.fn(),
    }
}));

jest.mock('../../../services/ai/CloudAIService', () => ({
    cloudAIService: {
        testConnection: jest.fn(),
    }
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
    return {
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => ({ navigate: mockNavigate }),
    };
});

jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    return {
        LogOut: () => <Text>LogOut</Text>,
        ChevronRight: () => <Text>ChevronRight</Text>,
        Brain: () => <Text>Brain</Text>,
        Zap: () => <Text>Zap</Text>,
        User: () => <Text>User</Text>,
        Info: () => <Text>Info</Text>,
        Cloud: () => <Text>Cloud</Text>,
        Check: () => <Text>Check</Text>,
        Loader: () => <Text>Loader</Text>,
        AlertTriangle: () => <Text>AlertTriangle</Text>,
        Save: () => <Text>Save</Text>
    };
});

describe('SettingsScreen', () => {
    const mockUser = { email: 'test@example.com', displayName: 'Test User' };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });
        (useSettingsStore as unknown as jest.Mock).mockImplementation((selector) => {
            // Mock store state
            const state = {
                provider: 'gemini',
                openRouterKey: '',
                selectedModel: null,
                setProvider: mockSetProvider,
                setOpenRouterKey: mockSetOpenRouterKey
            };
            // If selector is provided, use it (Zustand pattern)
            // But simpler for this test to just return state if we mock useSettingsStore simply.
            // However, code uses destructuring: const { provider ... } = useSettingsStore();
            return state;
        });
    });

    it('should render user profile', () => {
        const { getByText } = render(<SettingsScreen />);
        expect(getByText('Test User')).toBeTruthy();
        expect(getByText('test@example.com')).toBeTruthy();
    });

    it('should switch provider', () => {
        const { getByText } = render(<SettingsScreen />);

        fireEvent.press(getByText('Perplexity (Sonar)'));
        expect(mockSetProvider).toHaveBeenCalledWith('perplexity');
    });

    it('should handle logout', () => {
        const { getByText } = render(<SettingsScreen />);

        // Find logout button (text 'Log Out'). Note there are two 'Log Out' texts (button and alert title).
        // RNTL getByText returns first match or throws if multiple? 
        // Logic: "Log Out" is on the button.
        // Alert actions are generally not rendered in DOM until Alert is shown, but Alert.alert is imperative.
        // We should spy on Alert.alert.
        jest.spyOn(require('react-native').Alert, 'alert');

        // Settings has a Logout button at bottom.
        const logoutBtn = getByText('Log Out');
        fireEvent.press(logoutBtn);

        expect(require('react-native').Alert.alert).toHaveBeenCalled();
        // Since we can't easily press Alert buttons in simple RNTL without deeper mocking, 
        // we verified the button triggers the prompt.
    });
    it('should show key input and save key for provider', async () => {
        const { getByText, getByPlaceholderText } = render(<SettingsScreen />);

        // Select Gemini
        fireEvent.press(getByText('Google Gemini'));
        expect(mockSetProvider).toHaveBeenCalledWith('gemini');

        // Check for Input presence
        const input = getByPlaceholderText('Paste your API Key...');
        fireEvent.changeText(input, 'AIza-test-key');

        fireEvent.press(getByText('Save Key'));

        // Validation passes for 'AIza' prefix
        expect(mockSetGeminiKey).toHaveBeenCalledWith('AIza-test-key');
        expect(jest.requireActual('react-native').Alert.alert).toHaveBeenCalledWith("Saved", "Google Gemini Key Saved Successfully.");
    });

    it('should validate invalid key format', () => {
        const { getByText, getByPlaceholderText } = render(<SettingsScreen />);

        fireEvent.press(getByText('Google Gemini'));
        const input = getByPlaceholderText('Paste your API Key...');
        fireEvent.changeText(input, 'invalid-key');

        fireEvent.press(getByText('Save Key'));
        // Currently component shows inline validation error text but Save also triggers?
        // Let's check for validation error text
        expect(getByText('Invalid key format')).toBeTruthy();
    });

    it('should handle test connection failure', async () => {
        const { cloudAIService } = require('../../../services/ai/CloudAIService');
        (cloudAIService.testConnection as jest.Mock).mockResolvedValue(false);

        const { getByText, getByPlaceholderText } = render(<SettingsScreen />);

        fireEvent.press(getByText('Google Gemini'));
        fireEvent.changeText(getByPlaceholderText('Paste your API Key...'), 'AIza-test');
        fireEvent.press(getByText('Save Key'));

        const testBtn = getByText('Test Connection');
        fireEvent.press(testBtn);

        expect(getByText('Testing...')).toBeTruthy();

        await waitFor(() => {
            expect(jest.requireActual('react-native').Alert.alert).toHaveBeenCalledWith("Connection Failed", expect.stringContaining("Could not verify key"));
        });
    });

    it('should handle test connection success', async () => {
        const { cloudAIService } = require('../../../services/ai/CloudAIService');
        (cloudAIService.testConnection as jest.Mock).mockResolvedValue(true);

        const { getByText, getByPlaceholderText } = render(<SettingsScreen />);

        fireEvent.press(getByText('Perplexity (Sonar)'));
        fireEvent.changeText(getByPlaceholderText('Paste your API Key...'), 'pplx-test');
        fireEvent.press(getByText('Test Connection'));

        await waitFor(() => {
            expect(jest.requireActual('react-native').Alert.alert).toHaveBeenCalledWith("Connection Successful", expect.stringContaining("Successfully connected"));
        });
    });

    it('should navigate to model browser for OpenRouter', () => {
        // Mock store to be in OpenRouter mode
        (useSettingsStore as unknown as jest.Mock).mockReturnValue({
            provider: 'openrouter',
            openRouterKey: '',
            selectedModel: null,
            setProvider: mockSetProvider,
            setOpenRouterKey: mockSetOpenRouterKey
        });

        const { getByText } = render(<SettingsScreen />);

        // Now "Select a Model" should be visible
        fireEvent.press(getByText('Select a Model'));

        const { useNavigation } = require('@react-navigation/native');
        const navigation = useNavigation();
        expect(navigation.navigate).toHaveBeenCalledWith('ModelBrowser');
    });

    it('should display selected model', () => {
        (useSettingsStore as unknown as jest.Mock).mockImplementation(() => ({
            provider: 'openrouter',
            openRouterKey: 'sk-or-test',
            selectedModel: { name: 'DeepSeek V3', id: 'deepseek-v3' },
            setProvider: mockSetProvider,
            setOpenRouterKey: mockSetOpenRouterKey
        }));

        const { getByText } = render(<SettingsScreen />);
        expect(getByText('DeepSeek V3')).toBeTruthy();
        expect(getByText('deepseek-v3')).toBeTruthy();
    });

    it('should handle empty key validation', () => {
        const { getByText, getByPlaceholderText } = render(<SettingsScreen />);
        fireEvent.press(getByText('Google Gemini'));
        fireEvent.changeText(getByPlaceholderText('Paste your API Key...'), '');
        fireEvent.press(getByText('Save Key'));

        expect(jest.requireActual('react-native').Alert.alert).toHaveBeenCalledWith("Invalid Key", "Please enter an API Key.");
    });

    it('should handle missing key for test connection', () => {
        const { getByText, getByPlaceholderText } = render(<SettingsScreen />);
        fireEvent.press(getByText('Google Gemini'));
        // Ensure input is empty/cleared by default in this test run or manually clear
        fireEvent.changeText(getByPlaceholderText('Paste your API Key...'), '');

        fireEvent.press(getByText('Test Connection'));

        expect(jest.requireActual('react-native').Alert.alert).toHaveBeenCalledWith("Missing Key", "Please save a key first.");
    });
    it('should handle logout error', async () => {
        (authService.signOut as jest.Mock).mockRejectedValue(new Error('Logout Failed'));

        const { getByText } = render(<SettingsScreen />);
        const logoutBtn = getByText('Log Out');
        fireEvent.press(logoutBtn);

        // We need to trigger the alert action.
        // Since Alert.alert is imperative, we depend on how we test it.
        // We can mock Alert.alert to call the destructive button onPress immediately.
        const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
        mockAlert.mockImplementation((title, msg, buttons) => {
            const btns = buttons as any[];
            if (btns && btns.length > 1) {
                const logoutAction = btns.find(b => b.text === 'Log Out');
                if (logoutAction && logoutAction.onPress) {
                    logoutAction.onPress();
                }
            }
        });

        fireEvent.press(logoutBtn);

        await waitFor(() => {
            expect(require('react-native').Alert.alert).toHaveBeenCalledWith("Error", "Failed to log out");
        });
    });

    it('should validate Perplexity key format', () => {
        // Mock provider as perplexity
        (useSettingsStore as unknown as jest.Mock).mockReturnValue({
            provider: 'perplexity',
            setProvider: mockSetProvider,
            geminiKey: '',
            perplexityKey: '',
            setPerplexityKey: mockSetPerplexityKey
        });

        const { getByText, getByPlaceholderText } = render(<SettingsScreen />);

        fireEvent.changeText(getByPlaceholderText('Paste your API Key...'), 'invalid-pplx');
        fireEvent.press(getByText('Save Key'));
        expect(getByText('Invalid key format')).toBeTruthy();
    });

    it('should validate OpenRouter key format', () => {
        // Mock provider as openrouter
        (useSettingsStore as unknown as jest.Mock).mockReturnValue({
            provider: 'openrouter',
            setProvider: mockSetProvider,
            openRouterKey: '',
            setOpenRouterKey: mockSetOpenRouterKey
        });

        const { getByText, getByPlaceholderText } = render(<SettingsScreen />);

        fireEvent.changeText(getByPlaceholderText('sk-or-...'), 'invalid-or');
        fireEvent.press(getByText('Save Key'));
        expect(getByText('Invalid key format')).toBeTruthy();
    });
});
