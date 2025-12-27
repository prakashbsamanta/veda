import { useLLMStore } from '../llmStore';
import { cloudAIService } from '../../services/ai/CloudAIService';
import { DEFAULT_LLM_CONFIG } from '../../config/llmConfig';

// Mock CloudAIService
jest.mock('../../services/ai/CloudAIService', () => ({
    cloudAIService: {
        setConfig: jest.fn(),
    }
}));

describe('llmStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset store
        useLLMStore.setState({
            config: DEFAULT_LLM_CONFIG,
            totalTokensUsed: 0
        });
    });

    it('should have default state', () => {
        const state = useLLMStore.getState();
        expect(state.config).toEqual(DEFAULT_LLM_CONFIG);
        expect(state.totalTokensUsed).toBe(0);
    });

    it('should set config and update service', () => {
        const newConfig = {
            ...DEFAULT_LLM_CONFIG,
            apiKeyStorage: 'encrypted-local' as const
        };

        useLLMStore.getState().setConfig(newConfig);

        const state = useLLMStore.getState();
        expect(state.config).toEqual(newConfig);
        expect(cloudAIService.setConfig).toHaveBeenCalledWith(newConfig);
    });

    it('should update api key and service', () => {
        useLLMStore.getState().updateApiKey('new-key');

        const state = useLLMStore.getState();
        expect(state.config.primary.apiKey).toBe('new-key');
        expect(cloudAIService.setConfig).toHaveBeenCalledWith(
            expect.objectContaining({ primary: expect.objectContaining({ apiKey: 'new-key' }) })
        );
    });

    it('should increment tokens', () => {
        useLLMStore.getState().incrementTokens(10);
        expect(useLLMStore.getState().totalTokensUsed).toBe(10);

        useLLMStore.getState().incrementTokens(5);
        expect(useLLMStore.getState().totalTokensUsed).toBe(15);
    });
});
