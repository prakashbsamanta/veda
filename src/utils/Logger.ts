/**
 * Simple Logger utility to standardize logging across the app.
 * In production, this can be swapped for a real crash reporting service (e.g. Sentry/Crashlytics).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private static instance: Logger;
    private isDev: boolean = __DEV__;

    private constructor() { }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private log(level: LogLevel, message: string, data?: any) {
        if (!this.isDev && level === 'debug') return;

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        switch (level) {
            case 'debug':
                console.debug(prefix, message, data || '');
                break;
            case 'info':
                console.log(prefix, message, data || '');
                break;
            case 'warn':
                console.warn(prefix, message, data || '');
                break;
            case 'error':
                console.error(prefix, message, data || '');
                break;
        }
    }

    public debug(message: string, data?: any) {
        this.log('debug', message, data);
    }

    public info(message: string, data?: any) {
        this.log('info', message, data);
    }

    public warn(message: string, data?: any) {
        this.log('warn', message, data);
    }

    public error(message: string, error?: any) {
        this.log('error', message, error);
    }
}

export const logger = Logger.getInstance();
