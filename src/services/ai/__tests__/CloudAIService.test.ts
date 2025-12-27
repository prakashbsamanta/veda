import { CloudAIService } from '../CloudAIService';
import { DEFAULT_LLM_CONFIG } from '../../../config/llmConfig';

// Mock dependencies
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: { text: () => "Mock Gemini Response" }
            })
        })
    }))
}));

global.fetch = jest.fn();

describe('CloudAIService', () => {
    let service: CloudAIService;

    beforeEach(() => {
        // Reset singleton (if possible, or just re-get)
        // Since it's a singleton, we might need to be careful. 
        // For now, let's just get the instance.
        service = CloudAIService.getInstance();
        jest.clearAllMocks();
    });

    it('should initialize with default config', () => {
        expect(service).toBeDefined();
        // Since config is private, we can't check it directly without casting to any (testing workaround)
        expect((service as any).config).toEqual(DEFAULT_LLM_CONFIG);
    });

    it('should return true when gemini connection succeeds', async () => {
        const result = await service.testConnection('gemini', 'test-key');
        expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
        // Reset genAI instance
        service.setConfig({ ...DEFAULT_LLM_CONFIG });

        // Mock error override for this test
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        GoogleGenerativeAI.mockImplementationOnce(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: jest.fn().mockRejectedValue(new Error("API Error"))
            })
        }));

        const result = await service.testConnection('gemini', 'test-key');
        expect(result).toBe(false);
    });

    it('should return true when perplexity connection succeeds', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ choices: [{ message: { content: "OK" } }] })
        });
        const result = await service.testConnection('perplexity', 'pplx-key');
        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('perplexity.ai'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ 'Authorization': 'Bearer pplx-key' })
            })
        );
    });

    it('should generate text using perplexity', async () => {
        // Set config to perplexity
        service.setConfig({
            primary: { name: 'perplexity', apiKey: 'pplx-test', model: 'sonar', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: "AI Response" } }],
                usage: { total_tokens: 10 }
            })
        });

        const response = await service.generateText("Hello");
        expect(response.text).toBe("AI Response");
        expect(response.tokensUsed).toBe(10);
    });

    it('should handle missing api key safely', async () => {
        service.setConfig({
            primary: { name: 'perplexity', apiKey: '', model: 'sonar', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        const response = await service.generateText("Hello");
        expect(response.text).toContain("No Perplexity Key found");
    });

    it('should return true when openrouter connection succeeds', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ choices: [{ message: { content: "OK" } }] })
        });
        const result = await service.testConnection('openrouter', 'or-key');
        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('openrouter.ai'),
            expect.objectContaining({
                headers: expect.objectContaining({ 'X-Title': 'Veda Assistant' })
            })
        );
    });

    it('should generate text using openrouter', async () => {
        service.setConfig({
            primary: { name: 'openrouter', apiKey: 'or-test', model: 'mistral', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: "OpenRouter Response" } }],
                usage: { total_tokens: 20 }
            })
        });

        const response = await service.generateText("Hello OpenRouter");
        expect(response.text).toBe("OpenRouter Response");
        expect(response.tokensUsed).toBe(20);
    });

    it('should generate text using gemini', async () => {
        service.setConfig({
            primary: { name: 'gemini', apiKey: 'gemini-test', model: 'pro', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        // Mock re-setup for this test
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        GoogleGenerativeAI.mockImplementationOnce(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: jest.fn().mockResolvedValue({
                    response: { text: () => "Gemini Response" }
                })
            })
        }));

        const response = await service.generateText("Hello Gemini");
        expect(response.text).toBe("Gemini Response");
    });

    it('should handle missing gemini key', async () => {
        service.setConfig({
            primary: { name: 'gemini', apiKey: '', model: 'pro', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });
        const response = await service.generateText("Hello");
        expect(response.text).toContain("No API Key configured");
    });

    it('should handle openrouter error response', async () => {
        service.setConfig({
            primary: { name: 'openrouter', apiKey: 'or-test', model: 'mistral', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 402,
            text: async () => "Insufficient Credits"
        });

        await expect(service.generateText("Hello")).rejects.toThrow("Insufficient credits");
    });

    it('should throw error for unknown provider', async () => {
        service.setConfig({
            primary: { name: 'local', apiKey: '', model: 'llama', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        await expect(service.generateText("Hello")).rejects.toThrow("not implemented");
    });
    it('should handle missing openrouter key', async () => {
        service.setConfig({
            primary: { name: 'openrouter', apiKey: '', model: 'mistral', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });
        const response = await service.generateText("Hello");
        expect(response.text).toContain("OpenRouter API Key not set");
    });

    it('should handle perplexity error response', async () => {
        service.setConfig({
            primary: { name: 'perplexity', apiKey: 'pplx-test', model: 'sonar', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error"
        });

        await expect(service.generateText("Hello")).rejects.toThrow("Perplexity API Error (500)");
    });

    it('should handle openrouter 500 error', async () => {
        service.setConfig({
            primary: { name: 'openrouter', apiKey: 'or-test', model: 'mistral', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => "Bad Gateway"
        });

        await expect(service.generateText("Hello")).rejects.toThrow("OpenRouter Error (500)");
    });
    it('should return false if no key provided for connection test', async () => {
        service.setConfig({
            primary: { name: 'gemini', apiKey: '', model: 'pro', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });
        const result = await service.testConnection('gemini');
        expect(result).toBe(false);
    });

    it('should handle openrouter empty response', async () => {
        service.setConfig({
            primary: { name: 'openrouter', apiKey: 'or-test', model: 'mistral', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ choices: [], usage: null })
        });

        const response = await service.generateText("Hello");
        expect(response.text).toBe("No response text");
        expect(response.tokensUsed).toBe(0);
    });

    it('should handle perplexity empty response', async () => {
        service.setConfig({
            primary: { name: 'perplexity', apiKey: 'pplx-test', model: 'sonar', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ choices: [], usage: null })
        });

        const response = await service.generateText("Hello");
        expect(response.text).toBe("No response text");
        expect(response.tokensUsed).toBe(0);
    });

    it('should handle gemini SDK specific error', async () => {
        service.setConfig({
            primary: { name: 'gemini', apiKey: 'gemini-test', model: 'pro', maxTokens: 100, enabled: true },
            apiKeyStorage: 'encrypted-local'
        });

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        GoogleGenerativeAI.mockImplementationOnce(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: jest.fn().mockRejectedValue(new Error("SDK Crash"))
            })
        }));

        await expect(service.generateText("Crash")).rejects.toThrow("SDK Crash");
    });
});
