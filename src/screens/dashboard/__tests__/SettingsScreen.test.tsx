import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../SettingsScreen';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { authService } from '../../../services/auth/AuthService';

// Mock Dependencies
jest.mock('../../../store/authStore', () => ({
    useAuthStore: jest.fn(),
}));

const mockSetProvider = jest.fn();
const mockSetOpenRouterKey = jest.fn();
const mockSetGeminiKey = jest.fn();
const mockSetPerplexityKey = jest.fn();

jest.mock('../../../store/settingsStore', () => ({
    useSettingsStore: jest.fn(),
}));

// Mock CustomAlertModal
jest.mock('../../../components/common/CustomAlertModal', () => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return ({ visible, title, message, buttons }: any) => {
        if (!visible) return null;
        return (
            <View testID="custom-alert-modal">
                <Text testID="alert-title">{title}</Text>
                {message && <Text>{message}</Text>}
                {buttons && buttons.map((btn: any, idx: number) => (
                    <TouchableOpacity key={idx} testID={`alert-button-${idx}`} onPress={btn.onPress}>
                        <Text>{btn.text}</Text>
                    </TouchableOpacity>
                ))}
                {!buttons && (
                    // Default close button behavior simulation if needed
                    <TouchableOpacity testID="alert-button-close"><Text>OK</Text></TouchableOpacity>
                )}
            </View>
        );
    };
});

// Mock Auth Service
jest.mock('../../../services/auth/AuthService', () => ({
    authService: {
        signOut: jest.fn(),
    }
}));

// Mock Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
    return {
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => ({ navigate: mockNavigate }),
    };
});

// Mock Icons
jest.mock('lucide-react-native', () => {
    const { Text } = require('react-native');
    const MockIcon = (name: string) => () => <Text>{name}</Text>;
    return {
        LogOut: MockIcon('LogOut'),
        ChevronRight: MockIcon('ChevronRight'),
        Brain: MockIcon('Brain'),
        Zap: MockIcon('Zap'),
        User: MockIcon('User'),
        Info: MockIcon('Info'),
        Cloud: MockIcon('Cloud'),
        Check: MockIcon('Check'),
        Loader: MockIcon('Loader'),
        AlertTriangle: MockIcon('AlertTriangle'),
        Save: MockIcon('Save')
    };
});

describe('SettingsScreen', () => {
    const mockUser = { email: 'test@example.com', displayName: 'Test User' };
    let storeState: any;

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
        (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser });

        // Initialize state
        storeState = {
            provider: 'gemini',
            openRouterKey: '',
            geminiKey: '',
            perplexityKey: '',
            selectedModel: null
        };

        // Stateful updates
        mockSetProvider.mockImplementation((p: string) => { storeState.provider = p; });
        mockSetOpenRouterKey.mockImplementation((k: string) => { storeState.openRouterKey = k; });
        mockSetGeminiKey.mockImplementation((k: string) => { storeState.geminiKey = k; });
        mockSetPerplexityKey.mockImplementation((k: string) => { storeState.perplexityKey = k; });

        (useSettingsStore as unknown as jest.Mock).mockImplementation(() => ({
            ...storeState,
            setProvider: mockSetProvider,
            setOpenRouterKey: mockSetOpenRouterKey,
            setGeminiKey: mockSetGeminiKey,
            setPerplexityKey: mockSetPerplexityKey
        }));

        // Ensure static getState also works if needed (though component uses hook)
        (useSettingsStore as any).getState = () => ({
            ...storeState,
            setGeminiKey: mockSetGeminiKey, // etc
        });
    });

    it('should render user profile', () => {
        const { getByText } = render(<SettingsScreen />);
        expect(getByText('Test User')).toBeTruthy();
        expect(getByText('test@example.com')).toBeTruthy();
    });

    it('should switch provider', () => {
        const { getByText, rerender } = render(<SettingsScreen />);
        fireEvent.press(getByText('Perplexity (Sonar)'));
        expect(mockSetProvider).toHaveBeenCalledWith('perplexity');
        rerender(<SettingsScreen />);
    });

    it('should handle logout success', async () => {
        const { getByText, getByTestId } = render(<SettingsScreen />);
        fireEvent.press(getByTestId('logout-button'));
        expect(getByText('Are you sure you want to log out?')).toBeTruthy();
        fireEvent.press(getByTestId('alert-button-1'));
        await waitFor(() => {
            expect(authService.signOut).toHaveBeenCalled();
        });
    });

    it('should handle logout failure', async () => {
        (authService.signOut as jest.Mock).mockRejectedValue(new Error('Logout failed'));
        const { getByText, getByTestId } = render(<SettingsScreen />);
        fireEvent.press(getByTestId('logout-button'));
        fireEvent.press(getByTestId('alert-button-1'));
        await waitFor(() => {
            expect(getByTestId('alert-title').children[0]).toBe('Error');
        });
    });

    it('should show key input and save key for provider (Gemini)', async () => {
        const { getByText, getByPlaceholderText, getByTestId, rerender } = render(<SettingsScreen />);
        // Ensure provider is gemini (default)
        const input = getByPlaceholderText('Paste your API Key...');
        fireEvent.changeText(input, 'AIza-test-key');
        fireEvent.press(getByTestId('save-key-btn'));
        expect(mockSetGeminiKey).toHaveBeenCalledWith('AIza-test-key');
        expect(getByText("Saved")).toBeTruthy();
    });

    it('should show key input and save key for provider (Perplexity)', async () => {
        const { getByText, getByPlaceholderText, getByTestId, rerender } = render(<SettingsScreen />);
        fireEvent.press(getByText('Perplexity (Sonar)'));
        rerender(<SettingsScreen />);

        const input = getByPlaceholderText('Paste your API Key...');
        fireEvent.changeText(input, 'pplx-test-key');
        fireEvent.press(getByTestId('save-key-btn'));
        expect(mockSetPerplexityKey).toHaveBeenCalledWith('pplx-test-key');
        expect(getByText("Saved")).toBeTruthy();
    });

    it('should show key input and save key for provider (OpenRouter)', async () => {
        const { getByText, getByPlaceholderText, getByTestId, rerender } = render(<SettingsScreen />);
        fireEvent.press(getByText('OpenRouter (BYOK)'));
        rerender(<SettingsScreen />);

        const input = getByPlaceholderText('sk-or-...');
        fireEvent.changeText(input, 'sk-or-test-key');
        fireEvent.press(getByTestId('save-key-btn'));
        expect(mockSetOpenRouterKey).toHaveBeenCalledWith('sk-or-test-key');
        expect(getByText("Saved")).toBeTruthy();
    });

    it('should validate invalid key format (Perplexity)', () => {
        const { getByText, getByPlaceholderText, rerender } = render(<SettingsScreen />);
        fireEvent.press(getByText('Perplexity (Sonar)'));
        rerender(<SettingsScreen />);

        const input = getByPlaceholderText('Paste your API Key...');
        fireEvent.changeText(input, 'invalid-key');
        expect(getByText('Invalid key format')).toBeTruthy();
    });

    it('should validate invalid key format (OpenRouter)', () => {
        const { getByText, getByPlaceholderText, rerender } = render(<SettingsScreen />);
        fireEvent.press(getByText('OpenRouter (BYOK)'));
        rerender(<SettingsScreen />);

        const input = getByPlaceholderText('sk-or-...');
        fireEvent.changeText(input, 'invalid-sk');
        expect(getByText('Invalid key format')).toBeTruthy();
    });

    it('should handle test connection failure (Network Error)', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
        const { getByText, getByPlaceholderText, getByTestId, rerender } = render(<SettingsScreen />);

        fireEvent.changeText(getByPlaceholderText('Paste your API Key...'), 'AIza-test');
        fireEvent.press(getByTestId('save-key-btn'));
        // Modal for saved appears
        await waitFor(() => expect(getByText('Saved')).toBeTruthy());
        // Need to close it. Our mock doesn't show 'OK' button in buttons prop, but handleSave passes it.
        // handleSave: [{ text: "OK", onPress: hideAlert }]
        // Our mock maps buttons.
        fireEvent.press(getByText('OK'));

        fireEvent.press(getByTestId('test-connection-btn'));
        expect(getByText('Testing...')).toBeTruthy();
        await waitFor(() => {
            expect(getByText("Connection Error")).toBeTruthy();
        });
    });

    it('should handle test connection success (Perplexity)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true, status: 200, json: async () => ({})
        });
        const { getByText, getByPlaceholderText, getByTestId, rerender } = render(<SettingsScreen />);
        fireEvent.press(getByText('Perplexity (Sonar)'));
        rerender(<SettingsScreen />);

        fireEvent.changeText(getByPlaceholderText('Paste your API Key...'), 'pplx-test');
        fireEvent.press(getByTestId('save-key-btn'));
        fireEvent.press(getByText('OK'));

        fireEvent.press(getByTestId('test-connection-btn'));

        await waitFor(() => {
            expect(getByText("Connection Successful")).toBeTruthy();
        });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('api.perplexity.ai'),
            expect.anything()
        );
    });

    it('should handle test connection success (OpenRouter)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true, status: 200, json: async () => ({})
        });
        const { getByText, getByPlaceholderText, getByTestId, rerender } = render(<SettingsScreen />);
        fireEvent.press(getByText('OpenRouter (BYOK)'));
        rerender(<SettingsScreen />);

        fireEvent.changeText(getByPlaceholderText('sk-or-...'), 'sk-or-test');
        fireEvent.press(getByTestId('save-key-btn'));
        fireEvent.press(getByText('OK'));

        fireEvent.press(getByTestId('test-connection-btn'));

        await waitFor(() => {
            expect(getByText("Connection Successful")).toBeTruthy();
        });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('openrouter.ai'),
            expect.anything()
        );
    });

    it('should navigate to model browser for OpenRouter', () => {
        const { getByText, rerender } = render(<SettingsScreen />);
        fireEvent.press(getByText('OpenRouter (BYOK)'));
        rerender(<SettingsScreen />);
        fireEvent.press(getByText('Select a Model'));
        const { useNavigation } = require('@react-navigation/native');
        const navigation = useNavigation();
        expect(navigation.navigate).toHaveBeenCalledWith('ModelBrowser');
    });
});
