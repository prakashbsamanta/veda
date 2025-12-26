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
    selectedModel: OpenRouterModel | null;
    setProvider: (provider: 'gemini' | 'perplexity' | 'openrouter') => void;
    setOpenRouterKey: (key: string) => void;
    setSelectedModel: (model: OpenRouterModel | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            provider: DEFAULT_LLM_CONFIG.primary.name as 'gemini' | 'perplexity' || 'perplexity',
            openRouterKey: '',
            selectedModel: null,

            setOpenRouterKey: (key) => {
                set({ openRouterKey: key });
                const state = get();
                if (state.provider === 'openrouter') {
                    const { cloudAIService } = require('../services/ai/CloudAIService');
                    const currentConfig = { ...DEFAULT_LLM_CONFIG };
                    currentConfig.primary = {
                        ...DEFAULT_LLM_CONFIG.primary,
                        name: 'openrouter',
                        enabled: true,
                        apiKey: key,
                        model: state.selectedModel?.id || "mistralai/mistral-7b-instruct:free"
                    };
                    cloudAIService.setConfig(currentConfig);
                    logger.info(`Updated OpenRouter Key in Service`);
                }
            },

            setSelectedModel: (model) => {
                set({ selectedModel: model });
                const state = get();
                if (state.provider === 'openrouter') {
                    const { cloudAIService } = require('../services/ai/CloudAIService');
                    const currentConfig = { ...DEFAULT_LLM_CONFIG };
                    currentConfig.primary = {
                        ...DEFAULT_LLM_CONFIG.primary,
                        name: 'openrouter',
                        enabled: true,
                        apiKey: state.openRouterKey,
                        model: model?.id || "mistralai/mistral-7b-instruct:free"
                    };
                    cloudAIService.setConfig(currentConfig);
                    logger.info(`Updated OpenRouter Model in Service: ${model?.id}`);
                }
            },

            setProvider: (provider) => {
                set({ provider });
                const state = get();

                const currentConfig = { ...DEFAULT_LLM_CONFIG };

                // Update primary provider name
                if (provider === 'gemini') {
                    currentConfig.primary = { ...DEFAULT_LLM_CONFIG.primary, name: 'gemini', enabled: true };
                } else if (provider === 'perplexity') {
                    currentConfig.primary = { ...DEFAULT_LLM_CONFIG.primary, name: 'perplexity', enabled: true };
                } else {
                    currentConfig.primary = {
                        ...DEFAULT_LLM_CONFIG.primary,
                        name: 'openrouter',
                        enabled: true,
                        apiKey: state.openRouterKey, // Push the key!
                        model: state.selectedModel?.id || "mistralai/mistral-7b-instruct:free" // Push the model!
                    };
                }

                const { cloudAIService } = require('../services/ai/CloudAIService');
                cloudAIService.setConfig(currentConfig);
                logger.info(`AI Provider switched to: ${provider}`);
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
                    const currentConfig = { ...DEFAULT_LLM_CONFIG };

                    if (state.provider === 'openrouter') {
                        currentConfig.primary = {
                            ...DEFAULT_LLM_CONFIG.primary,
                            name: 'openrouter',
                            enabled: true,
                            apiKey: state.openRouterKey,
                            model: state.selectedModel?.id || "mistralai/mistral-7b-instruct:free"
                        };
                    } else {
                        currentConfig.primary.name = state.provider as any;
                    }

                    const { cloudAIService } = require('../services/ai/CloudAIService');
                    cloudAIService.setConfig(currentConfig);
                    logger.info(`Settings hydrated. AI Provider: ${state.provider}`);
                }
            }
        }
    )
);
