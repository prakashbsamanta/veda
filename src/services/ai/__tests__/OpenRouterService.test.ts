import { OpenRouterService } from '../OpenRouterService';
import { logger } from '../../../utils/Logger';

// Mock Logger
jest.mock('../../../utils/Logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    }
}));

describe('OpenRouterService', () => {
    let service: OpenRouterService;

    beforeEach(() => {
        service = OpenRouterService.getInstance();
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    it('should fetch models successfully', async () => {
        const mockModels = [{ id: 'model-1', name: 'Model 1' }];
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ data: mockModels })
        });

        const models = await service.fetchModels();

        expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
        expect(models).toEqual(mockModels);
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Fetched 1 models'));
    });

    it('should throw error on api failure', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500
        });

        await expect(service.fetchModels()).rejects.toThrow('Failed to fetch models: 500');
        expect(logger.error).toHaveBeenCalled();
    });

    it('should throw error on network failure', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

        await expect(service.fetchModels()).rejects.toThrow('Network Error');
        expect(logger.error).toHaveBeenCalled();
    });
});
