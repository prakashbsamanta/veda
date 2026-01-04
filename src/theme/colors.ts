export const colors = {
    background: {
        primary: '#1C1C1E',
        secondary: '#2C2C2E',
        tertiary: '#3A3A3C',
        modal: '#2C2C2E',
    },
    text: {
        primary: '#E5D0AC', // Gold/Beige
        secondary: '#FFFFFF', // White
        muted: '#A1A1AA', // Grey
        inverse: '#1C1C1E', // Dark text on light backgrounds
        disabled: '#3A3A3C',
    },
    accent: {
        primary: '#E5D0AC',
        secondary: '#4A90E2', // Blue
        error: '#FF453A', // Red
        success: '#32D74B', // Green
        warning: '#FFD60A', // Yellow/Gold
    },
    border: {
        primary: '#2C2C2E',
        subtle: 'rgba(255, 255, 255, 0.1)',
    },
    transparent: {
        background_subtle: 'rgba(255, 255, 255, 0.05)',
        accent_subtle: 'rgba(229, 208, 172, 0.1)',
        blue_subtle: 'rgba(74, 144, 226, 0.1)',
    }
} as const;
