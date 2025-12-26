import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LLM_CONFIG, LLMConfig } from '../config/llmConfig';
import { cloudAIService } from '../services/ai/CloudAIService';
import { logger } from '../utils/Logger';

interface SettingsState {
    provider: 'gemini' | 'perplexity';
    setProvider: (provider: 'gemini' | 'perplexity') => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            provider: DEFAULT_LLM_CONFIG.primary.name as 'gemini' | 'perplexity' || 'perplexity', // Default fallback
            setProvider: (provider) => {
                set({ provider });

                // Update the CloudAIService configuration dynamically
                const currentConfig = { ...DEFAULT_LLM_CONFIG };

                // Toggle enabled flags based on selection (Optional, but good for clarity)
                if (provider === 'gemini') {
                    currentConfig.primary = { ...DEFAULT_LLM_CONFIG.primary, name: 'gemini', enabled: true };
                    // Add specific Gemini configs if needed, though CloudAIService handles keys based on name
                } else {
                    currentConfig.primary = { ...DEFAULT_LLM_CONFIG.primary, name: 'perplexity', enabled: true };
                }

                // Ideally, we might want to have separate full config objects for each, 
                // but CloudAIService logic switches correctly based on .name and .env keys
                // We just need to ensure the service knows the 'primary' provider name.

                // Simple override for now since CloudAIService.generateText checks config.primary.name
                currentConfig.primary.name = provider;

                cloudAIService.setConfig(currentConfig);
                logger.info(`AI Provider switched to: ${provider}`);
            },
        }),
        {
            name: 'veda-settings',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                // When hydration finishes, ensure the service is synced with the persisted state
                if (state) {
                    const currentConfig = { ...DEFAULT_LLM_CONFIG };
                    currentConfig.primary.name = state.provider;
                    cloudAIService.setConfig(currentConfig);
                    logger.info(`Settings hydrated. AI Provider: ${state.provider}`);
                }
            }
        }
    )
);
