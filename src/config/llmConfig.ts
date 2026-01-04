import { GEMINI_API_KEY, PERPLEXITY_API_KEY } from '@env';
import { LLMConfig } from '../types';

// Default Configuration: Perplexity (Sonar Pro)
console.log('[Config] Loading Keys. Gemini:', !!GEMINI_API_KEY, 'Perplexity:', !!PERPLEXITY_API_KEY);

export const DEFAULT_LLM_CONFIG: LLMConfig = {
    primary: {
        name: "perplexity",
        apiKey: PERPLEXITY_API_KEY || "",
        model: "sonar-pro",
        maxTokens: 1000,
        costPerMTok: 0,
        enabled: true,
    },
    apiKeyStorage: "encrypted-local",
};
