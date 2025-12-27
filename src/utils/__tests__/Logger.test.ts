import { logger } from '../Logger';

describe('Logger', () => {
    // Save original console methods and __DEV__
    const originalConsole = { ...console };
    const originalDev = (global as any).__DEV__;

    beforeEach(() => {
        // Reset singleton (accessing private static instance via any)
        (logger.constructor as any).instance = undefined;

        // Mock console methods
        console.debug = jest.fn();
        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        // Restore console and __DEV__
        console.debug = originalConsole.debug;
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        (global as any).__DEV__ = originalDev;
    });

    it('should be a singleton', () => {
        // Since we reset the instance in beforeEach, the exported 'logger' 
        // will identify as a different object than the new one created by getInstance()
        // So we must compare two calls to getInstance
        const instance1 = (logger.constructor as any).getInstance();
        const instance2 = (logger.constructor as any).getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should log debug messages when __DEV__ is true', () => {
        (global as any).__DEV__ = true;
        // Reset instance to pick up new DEV value
        (logger.constructor as any).instance = undefined;
        const devLogger = (logger.constructor as any).getInstance();

        devLogger.debug('test debug', { foo: 'bar' });

        expect(console.debug).toHaveBeenCalledWith(
            expect.stringContaining('[DEBUG]'),
            'test debug',
            { foo: 'bar' }
        );
    });

    it('should NOT log debug messages when __DEV__ is false', () => {
        (global as any).__DEV__ = false;
        (logger.constructor as any).instance = undefined;
        const prodLogger = (logger.constructor as any).getInstance();

        prodLogger.debug('test debug');

        expect(console.debug).not.toHaveBeenCalled();
    });

    it('should log info messages', () => {
        logger.info('test info');
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('[INFO]'),
            'test info',
            expect.anything() // data is optional
        );
    });

    it('should log warn messages', () => {
        logger.warn('test warn');
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('[WARN]'),
            'test warn',
            expect.anything()
        );
    });

    it('should log error messages', () => {
        const err = new Error('oops');
        logger.error('test error', err);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('[ERROR]'),
            'test error',
            err
        );
    });

    it('should include timestamp in logs', () => {
        logger.info('timestamp check');
        const lastCall = (console.log as jest.Mock).mock.calls[0];
        const prefix = lastCall[0];
        // Expect ISO string format roughly: [202...-..-..T..:..:..]
        expect(prefix).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });
});
