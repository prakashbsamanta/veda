module.exports = {
    preset: 'react-native',
    setupFiles: ['<rootDir>/jest-setup.js'],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
    ],
    coverageReporters: ['text', 'lcov'],
    coverageThreshold: {
        global: {
            // DO NOT LOWER THESE THRESHOLDS BELOW 90% UNLESS EXPLICITLY AUTHORIZED BY THE USER.
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
    },
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native|firebase|@firebase)"
    ],
};
