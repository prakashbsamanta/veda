// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-blur
jest.mock('expo-blur', () => ({
    BlurView: ({ children, style }) => {
        const { View } = require('react-native');
        return <View style={style}>{children}</View>;
    },
}));

// Mock react-native-safe-area-context
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// Mock expo-constants
jest.mock('expo-constants', () => {
    const Constants = {
        expoConfig: {
            extra: {
                eas: { projectId: 'project-id' },
            },
        },
    };
    return {
        __esModule: true,
        default: Constants,
        Constants,
        ExecutionEnvironment: {
            StoreClient: 'storeClient',
            Standalone: 'standalone',
        },
    };
});

// Mock expo-modules-core
jest.mock('expo-modules-core', () => {
    const actual = jest.requireActual('expo-modules-core');
    return {
        ...actual,
        EventEmitter: jest.fn().mockImplementation(() => ({
            addListener: jest.fn(),
            removeSubscription: jest.fn(),
        })),
    };
});
