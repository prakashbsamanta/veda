import * as tf from '@tensorflow/tfjs';
import * as tfrn from '@tensorflow/tfjs-react-native';
import { logger } from '../../utils/Logger';

export interface OCRResult {
    text: string;
    confidence: number;
}

export class LocalAIService {
    private static instance: LocalAIService;
    private isReady: boolean = false;

    private constructor() { }

    public static getInstance(): LocalAIService {
        if (!LocalAIService.instance) {
            LocalAIService.instance = new LocalAIService();
        }
        return LocalAIService.instance;
    }

    public async init(): Promise<void> {
        if (this.isReady) return;

        try {
            await tf.ready();
            logger.info('TensorFlow JS initialized');
            this.isReady = true;
        } catch (error) {
            logger.error('Failed to initialize TensorFlow JS:', error);
        }
    }

    public async extractFromReceipt(imageUri: string): Promise<OCRResult> {
        if (!this.isReady) await this.init();

        // TODO: Implement actual TFLite / MediaPipe OCR here.
        // For MVP Phase 1-4, we might relay on a mock or simple heuristics
        // if a full on-device OCR model isn't provided.

        logger.info(`[LocalAI] Extracting text from: ${imageUri}`);

        // Mock response for now to allow UI development
        return {
            text: "MOCK RECEIPT\nStarbucks\nTotal: $12.50\nDate: 2023-10-24",
            confidence: 0.95
        };
    }
}

export const localAIService = LocalAIService.getInstance();
