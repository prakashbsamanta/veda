import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LLM_CONFIG, LLMConfig } from '../config/llmConfig';
// import { cloudAIService } from '../services/ai/CloudAIService';
import { logger } from '../utils/Logger';

export interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing: {
        prompt: string;
        completion: string;
    };
}

interface SettingsState {
    provider: 'gemini' | 'perplexity' | 'openrouter';
    openRouterKey: string;
    geminiKey: string;
    perplexityKey: string;
    selectedModel: OpenRouterModel | null;
    setProvider: (provider: 'gemini' | 'perplexity' | 'openrouter') => void;
    setOpenRouterKey: (key: string) => void;
    setGeminiKey: (key: string) => void;
    setPerplexityKey: (key: string) => void;
    setSelectedModel: (model: OpenRouterModel | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            provider: DEFAULT_LLM_CONFIG.primary.name as 'gemini' | 'perplexity' || 'perplexity',
            openRouterKey: '',
            geminiKey: '',
            perplexityKey: '',
            selectedModel: null,

            setOpenRouterKey: (key) => {
                set({ openRouterKey: key });
                const state = get();
                if (state.provider === 'openrouter') {
                    pushConfigToService(state);
                }
            },

            setGeminiKey: (key) => {
                set({ geminiKey: key });
                const state = get();
                if (state.provider === 'gemini') {
                    pushConfigToService(state);
                }
            },

            setPerplexityKey: (key) => {
                set({ perplexityKey: key });
                const state = get();
                if (state.provider === 'perplexity') {
                    pushConfigToService(state);
                }
            },

            setSelectedModel: (model) => {
                set({ selectedModel: model });
                const state = get();
                if (state.provider === 'openrouter') {
                    pushConfigToService(state);
                }
            },

            setProvider: (provider) => {
                set({ provider });
                const state = get();
                pushConfigToService(state);
            },
        }),
        {
            name: 'veda-settings',
            storage: createJSONStorage(() => AsyncStorage),
            // Migrations could be added here if needed, but since we are just adding keys, it should be fine.
            // However, cleaning async storage might be needed if state structure conflicts badly, 
            // but zustand persist usually handles adding new keys gracefully (they start undefined).
            onRehydrateStorage: () => (state) => {
                if (state) {
                    pushConfigToService(state);
                    logger.info(`Settings hydrated. AI Provider: ${state.provider}`);
                }
            }
        }
    )
);

// Helper to avoid duplication and ensure consistent config injection
const pushConfigToService = (state: SettingsState) => {
    const { cloudAIService } = require('../services/ai/CloudAIService');
    const currentConfig = { ...DEFAULT_LLM_CONFIG };

    if (state.provider === 'gemini') {
        currentConfig.primary = {
            ...DEFAULT_LLM_CONFIG.primary,
            name: 'gemini',
            enabled: true,
            apiKey: state.geminiKey || DEFAULT_LLM_CONFIG.primary.apiKey
        };
    } else if (state.provider === 'perplexity') {
        currentConfig.primary = {
            ...DEFAULT_LLM_CONFIG.primary,
            name: 'perplexity',
            enabled: true,
            apiKey: state.perplexityKey || DEFAULT_LLM_CONFIG.primary.apiKey
        };
    } else {
        // OpenRouter
        currentConfig.primary = {
            ...DEFAULT_LLM_CONFIG.primary,
            name: 'openrouter',
            enabled: true,
            apiKey: state.openRouterKey,
            model: state.selectedModel?.id || "mistralai/mistral-7b-instruct:free"
        };
    }

    cloudAIService.setConfig(currentConfig);
    logger.info(`Config pushed to service for provider: ${state.provider}`);
};
