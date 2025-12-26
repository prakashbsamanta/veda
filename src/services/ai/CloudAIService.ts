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

        throw new Error(`Provider ${provider.name} not implemented yet`);
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
