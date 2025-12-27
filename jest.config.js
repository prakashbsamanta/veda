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
            branches: 92,
            functions: 92,
            lines: 92,
            statements: 92,
        },
    },
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native|firebase|@firebase)"
    ],
};
