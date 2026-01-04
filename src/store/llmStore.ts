import { create } from 'zustand';
import { DEFAULT_LLM_CONFIG } from '../config/llmConfig';
import { LLMConfig } from '../types';

import { cloudAIService } from '../services/ai/CloudAIService';

interface LLMState {
    config: LLMConfig;
    totalTokensUsed: number;
    setConfig: (config: LLMConfig) => void;
    updateApiKey: (key: string) => void;
    incrementTokens: (amount: number) => void;
}

export const useLLMStore = create<LLMState>((set, get) => ({
    config: DEFAULT_LLM_CONFIG,
    totalTokensUsed: 0,

    setConfig: (config) => {
        set({ config });
        cloudAIService.setConfig(config);
    },

    updateApiKey: (key) => {
        const newConfig = { ...get().config };
        newConfig.primary.apiKey = key;
        set({ config: newConfig });
        cloudAIService.setConfig(newConfig);
    },

    incrementTokens: (amount) => set((state) => ({ totalTokensUsed: state.totalTokensUsed + amount })),
}));
