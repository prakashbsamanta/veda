import { logger } from "../../utils/Logger";

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

export class OpenRouterService {
    private static instance: OpenRouterService;
    private readonly API_URL = "https://openrouter.ai/api/v1/models";

    private constructor() { }

    public static getInstance(): OpenRouterService {
        if (!OpenRouterService.instance) {
            OpenRouterService.instance = new OpenRouterService();
        }
        return OpenRouterService.instance;
    }

    public async fetchModels(): Promise<OpenRouterModelDTO[]> {
        try {
            logger.info("Fetching OpenRouter models...");
            const response = await fetch(this.API_URL);

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status}`);
            }

            const data = await response.json();
            const models = data.data as OpenRouterModelDTO[];

            logger.info(`Fetched ${models.length} models from OpenRouter.`);
            return models;
        } catch (error) {
            logger.error("Error fetching OpenRouter models", error);
            throw error;
        }
    }
}

export const openRouterService = OpenRouterService.getInstance();
