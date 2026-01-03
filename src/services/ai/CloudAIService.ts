import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMConfig, DEFAULT_LLM_CONFIG } from '../../config/llmConfig';
import { logger } from '../../utils/Logger';

export interface AIResponse {
    text: string;
    tokensUsed: number;
}

export class CloudAIService {
    private static instance: CloudAIService;
    private config: LLMConfig = DEFAULT_LLM_CONFIG;
    private genAI: GoogleGenerativeAI | null = null;

    private constructor() { }

    public static getInstance(): CloudAIService {
        if (!CloudAIService.instance) {
            CloudAIService.instance = new CloudAIService();
        }
        return CloudAIService.instance;
    }

    public setConfig(config: LLMConfig) {
        this.config = config;
        this.genAI = null; // Reset SDK instance if config changes
    }

    public async testConnection(provider: 'gemini' | 'perplexity' | 'openrouter', apiKey?: string): Promise<boolean> {
        try {
            logger.info(`Testing connection for ${provider}...`);
            const testPrompt = "Hi"; // Minimal token usage

            // Use provided key or fallback to config
            const keyToTest = apiKey || this.config.primary.apiKey;
            if (!keyToTest) return false;

            if (provider === 'gemini') {
                await this.callGeminiSDK(testPrompt, keyToTest, "gemini-pro");
            } else if (provider === 'perplexity') {
                await this.callPerplexity(testPrompt, keyToTest, "sonar-small-online");
            } else if (provider === 'openrouter') {
                await this.callOpenRouter(testPrompt, keyToTest, "mistralai/mistral-7b-instruct:free");
            }

            return true;
        } catch (error) {
            logger.error(`Connection test failed for ${provider}:`, error);
            return false;
        }
    }

    private getClient(apiKey: string): GoogleGenerativeAI {
        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
        return this.genAI;
    }

    public async generateText(prompt: string): Promise<AIResponse> {
        const provider = this.config.primary;

        if (provider.name === 'gemini') {
            const apiKey = provider.apiKey;
            if (!apiKey) {
                logger.warn("No Gemini API Key provided.");
                return {
                    text: "No API Key configured. Please check your .env or llmConfig.ts.",
                    tokensUsed: 0
                };
            }

            return this.callGeminiSDK(prompt, apiKey, provider.model);
        }

        if (provider.name === 'perplexity') {
            const apiKey = provider.apiKey;
            if (!apiKey) {
                logger.warn("No Perplexity API Key provided.");
                return {
                    text: "No Perplexity Key found. Please add PERPLEXITY_API_KEY to your .env file.",
                    tokensUsed: 0
                };
            }
            return this.callPerplexity(prompt, apiKey, provider.model);
        }

        if (provider.name === 'openrouter') {
            const apiKey = provider.apiKey; // Config injection
            const modelId = provider.model || "mistralai/mistral-7b-instruct:free";

            if (!apiKey) {
                return {
                    text: "OpenRouter API Key not set. Please configure it in Settings.",
                    tokensUsed: 0
                };
            }

            return this.callOpenRouter(prompt, apiKey, modelId);
        }

        throw new Error(`Provider ${provider.name} not implemented yet`);
    }

    // New method for Audio/Multimodal input
    public async generateResponseFromAudio(audioBase64: string, mimeType: string = "audio/mp4"): Promise<AIResponse> {
        const provider = this.config.primary;

        // Currently, only Gemini supports native audio input easily via this SDK structure
        if (provider.name !== 'gemini') {
            throw new Error("Audio input is currently only supported for Gemini provider.");
        }

        const apiKey = provider.apiKey;
        if (!apiKey) {
            return {
                text: "No API Key configured for Gemini.",
                tokensUsed: 0
            };
        }

        try {
            const client = this.getClient(apiKey);
            const model = client.getGenerativeModel({ model: provider.model || "gemini-1.5-flash" });

            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: audioBase64
                    }
                },
                { text: "Listen to this audio and respond naturally to the user." }
            ]);

            const response = await result.response;
            const text = response.text();
            
            return { text, tokensUsed: 0 };
        } catch (error) {
            logger.error("Gemini Audio processing failed:", error);
            throw error;
        }
    }

    private async callOpenRouter(prompt: string, apiKey: string, modelId: string): Promise<AIResponse> {
        try {
            logger.info(`Calling OpenRouter with model: ${modelId}`);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "https://eda-app.com",
                    "X-Title": "Veda Assistant",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        { role: "system", content: "You are Veda, an advanced AI assistant." },
                        { role: "user", content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                // Check for credit errors (402 or 403 usually)
                if (response.status === 402) {
                    throw new Error("Insufficient credits on OpenRouter. Please check your account balance.");
                }
                throw new Error(`OpenRouter Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || "No response text";

            // OpenRouter usually follows OpenAI format for usage
            const tokens = data.usage?.total_tokens || 0;

            return { text, tokensUsed: tokens };

        } catch (error) {
            logger.error("OpenRouter call failed:", error);
            throw error;
        }
    }

    private async callPerplexity(prompt: string, apiKey: string, modelName: string): Promise<AIResponse> {
        try {
            logger.info(`Calling Perplexity API with model: ${modelName}. Key Length: ${apiKey.length}`);
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "system", content: "You are Veda, an advanced AI assistant." },
                        { role: "user", content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Perplexity API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || "No response text";

            // Perplexity usage format: { prompt_tokens, completion_tokens, total_tokens }
            const tokens = data.usage?.total_tokens || 0;

            return { text, tokensUsed: tokens };

        } catch (error) {
            logger.error("Perplexity call failed:", error);
            throw error; // Re-throw so UI shows the error
        }
    }

    private async callGeminiSDK(prompt: string, apiKey: string, modelName: string): Promise<AIResponse> {
        try {
            const client = this.getClient(apiKey);
            const model = client.getGenerativeModel({ model: modelName });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const tokens = 0;

            return { text, tokensUsed: tokens };
        } catch (error) {
            logger.error("Gemini SDK call failed:", error);
            throw error;
        }
    }
}

export const cloudAIService = CloudAIService.getInstance();
