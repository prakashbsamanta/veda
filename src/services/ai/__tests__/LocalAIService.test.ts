import { LocalAIService } from '../LocalAIService';
import * as tf from '@tensorflow/tfjs';
import { logger } from '../../../utils/Logger';

// Mock Dependencies
jest.mock('@tensorflow/tfjs', () => ({
    ready: jest.fn(),
}));

jest.mock('@tensorflow/tfjs-react-native', () => ({}));

jest.mock('../../../utils/Logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    }
}));

describe('LocalAIService', () => {
    let service: LocalAIService;

    beforeEach(() => {
        // Reset singleton (hacky but needed for stateful singleton)
        // Since init checks isReady, we need new instance or reset isReady.
        (LocalAIService as any).instance = undefined;
        service = LocalAIService.getInstance();
        jest.clearAllMocks();
    });

    it('should initialize successfully', async () => {
        (tf.ready as jest.Mock).mockResolvedValue(undefined);

        await service.init();

        expect(tf.ready).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('TensorFlow JS initialized');
    });

    it('should handle initialization error', async () => {
        (tf.ready as jest.Mock).mockRejectedValue(new Error('TF Error'));

        await service.init();

        expect(logger.error).toHaveBeenCalledWith('Failed to initialize TensorFlow JS:', expect.any(Error));
    });

    it('should skip initialization if already ready', async () => {
        (tf.ready as jest.Mock).mockResolvedValue(undefined);
        await service.init(); // First time
        (tf.ready as jest.Mock).mockClear();

        await service.init(); // Second time
        expect(tf.ready).not.toHaveBeenCalled();
    });

    it('should extract from receipt', async () => {
        (tf.ready as jest.Mock).mockResolvedValue(undefined);

        const result = await service.extractFromReceipt('image-uri');

        // Should init if not ready
        expect(tf.ready).toHaveBeenCalled();

        expect(result).toEqual({
            text: expect.stringContaining('MOCK RECEIPT'),
            confidence: 0.95
        });
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Extracting text'));
    });

    it('should skip init in extract if already ready', async () => {
        (tf.ready as jest.Mock).mockResolvedValue(undefined);
        await service.init(); // Make ready
        (tf.ready as jest.Mock).mockClear();

        await service.extractFromReceipt('uri');

        expect(tf.ready).not.toHaveBeenCalled();
    });

    it('should return same singleton instance', () => {
        const s1 = LocalAIService.getInstance();
        const s2 = LocalAIService.getInstance();
        expect(s1).toBe(s2);
    });
});
