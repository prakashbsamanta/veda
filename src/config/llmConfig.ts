import { GEMINI_API_KEY, PERPLEXITY_API_KEY } from '@env';

// ... (interfaces remain same)
export interface LLMProvider {
    name: "gemini" | "perplexity" | "claude" | "custom" | "local";
    apiKey?: string;
    baseUrl?: string;
    model: string;
    maxTokens: number;
    costPerMTok?: number;
    enabled: boolean;
}

export interface LLMConfig {
    primary: LLMProvider;
    fallback?: LLMProvider;
    custom?: LLMProvider[];
    apiKeyStorage: "encrypted-local";
}

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
