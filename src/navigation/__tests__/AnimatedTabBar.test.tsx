import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AnimatedTabBar from '../AnimatedTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock dependencies
jest.mock('expo-blur', () => ({
    BlurView: ({ children, style }: any) => {
        const { View } = require('react-native');
        return <View style={style}>{children}</View>;
    },
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
    BottomTabBarProps: {},
}));

describe('AnimatedTabBar', () => {
    const mockNavigation = {
        emit: jest.fn(),
        navigate: jest.fn(),
    };

    const mockPosition = { interpolate: jest.fn() } as any; // Mock Animated.Value interface roughly
    const mockLayout = { width: 320, height: 60 };
    const mockJumpTo = jest.fn();

    const mockState = {
        index: 0,
        routes: [
            { key: 'route-1', name: 'Home' },
            { key: 'route-2', name: 'Settings' },
            { key: 'route-3', name: 'Debug' },
        ],
    };

    const mockDescriptors = {
        'route-1': {
            options: {
                tabBarLabel: 'Home Label',
                tabBarIcon: () => null,
            },
        },
        'route-2': {
            options: {
                title: 'Settings Title',
            },
        },
        'route-3': {
            options: {
                tabBarLabel: 'Debug',
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useSafeAreaInsets as jest.Mock).mockReturnValue({ bottom: 0, top: 0, left: 0, right: 0 });
    });

    it('should render correctly', () => {
        const { getByText, queryByText } = render(
            <AnimatedTabBar
                state={mockState as any}
                descriptors={mockDescriptors as any}
                navigation={mockNavigation as any}
                layout={mockLayout}
                position={mockPosition}
                jumpTo={mockJumpTo}
            />
        );

        expect(getByText('Home Label')).toBeTruthy();
        expect(getByText('Settings Title')).toBeTruthy();
        expect(queryByText('Debug')).toBeNull(); // Debug route should be hidden
    });

    it('should handle safe area insets', () => {
        (useSafeAreaInsets as jest.Mock).mockReturnValue({ bottom: 34, top: 0, left: 0, right: 0 });
        render(
            <AnimatedTabBar
                state={mockState as any}
                descriptors={mockDescriptors as any}
                navigation={mockNavigation as any}
                layout={mockLayout}
                position={mockPosition}
                jumpTo={mockJumpTo}
            />
        );
        // We can't easily check styles in unit test without testID on containers, but we verify it renders without crash
    });

    it('should navigate on press if not focused', () => {
        const { getByText } = render(
            <AnimatedTabBar
                state={mockState as any}
                descriptors={mockDescriptors as any}
                navigation={mockNavigation as any}
                layout={mockLayout}
                position={mockPosition}
                jumpTo={mockJumpTo}
            />
        );

        mockNavigation.emit.mockReturnValue({ defaultPrevented: false });

        fireEvent.press(getByText('Settings Title')); // Index 1, currently index 0 is focused

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Settings', undefined);
        expect(mockNavigation.emit).toHaveBeenCalledWith({
            type: 'tabPress',
            target: 'route-2',
            canPreventDefault: true,
        });
    });

    it('should NOT navigate on press if focused', () => {
        const { getByText } = render(
            <AnimatedTabBar
                state={mockState as any}
                descriptors={mockDescriptors as any}
                navigation={mockNavigation as any}
                layout={mockLayout}
                position={mockPosition}
                jumpTo={mockJumpTo}
            />
        );

        mockNavigation.emit.mockReturnValue({ defaultPrevented: false });

        fireEvent.press(getByText('Home Label')); // Index 0, already focused

        expect(mockNavigation.navigate).not.toHaveBeenCalled();
        expect(mockNavigation.emit).toHaveBeenCalledWith({
            type: 'tabPress',
            target: 'route-1',
            canPreventDefault: true,
        });
    });

    it('should NOT navigate on press if default prevented', () => {
        const { getByText } = render(
            <AnimatedTabBar
                state={mockState as any}
                descriptors={mockDescriptors as any}
                navigation={mockNavigation as any}
                layout={mockLayout}
                position={mockPosition}
                jumpTo={mockJumpTo}
            />
        );

        mockNavigation.emit.mockReturnValue({ defaultPrevented: true });

        fireEvent.press(getByText('Settings Title'));

        expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it('should emit tabLongPress on long press', () => {
        const { getByText } = render(
            <AnimatedTabBar
                state={mockState as any}
                descriptors={mockDescriptors as any}
                navigation={mockNavigation as any}
                layout={mockLayout}
                position={mockPosition}
                jumpTo={mockJumpTo}
            />
        );

        fireEvent(getByText('Home Label'), 'longPress');

        expect(mockNavigation.emit).toHaveBeenCalledWith({
            type: 'tabLongPress',
            target: 'route-1',
        });
    });

    it('should fallback to route name if no label/title provided', () => {
        const splitDescriptors = {
            'route-1': { options: {} }
        };
        const splitState = {
            index: 0,
            routes: [{ key: 'route-1', name: 'FallbackName' }]
        };

        const { getByText } = render(
            <AnimatedTabBar
                state={splitState as any}
                descriptors={splitDescriptors as any}
                navigation={mockNavigation as any}
                layout={mockLayout}
                position={mockPosition}
                jumpTo={mockJumpTo}
            />
        );

        expect(getByText('FallbackName')).toBeTruthy();
    });
});
