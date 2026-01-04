export type LLMProviderName = "gemini" | "perplexity" | "claude" | "custom" | "local" | "openrouter";

export interface LLMProvider {
    name: LLMProviderName;
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

export interface AIResponse {
    text: string;
    tokensUsed: number;
}

export interface OCRResult {
    text: string;
    confidence: number;
}

export interface OpenRouterModelDTO {
    id: string;
    name: string;
    description: string;
    pricing: {
        prompt: string;
        completion: string;
    };
    context_length: number;
    architecture: {
        tokenizer: string;
        instruct_type: string;
        modality: string;
    };
    top_provider: {
        context_length: number;
        max_completion_tokens: number;
        is_moderated: boolean;
    };
    per_request_limits: any;
}
