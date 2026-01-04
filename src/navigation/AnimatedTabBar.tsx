import { BlurView } from 'expo-blur';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function AnimatedTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
    const insets = useSafeAreaInsets();
    const paddingBottom = Math.max(insets.bottom, 20);
    const containerHeight = 60 + paddingBottom;

    return (
        <View style={[styles.outerContainer, { height: containerHeight }]}>
            <BlurView
                tint="dark"
                intensity={100}
                style={StyleSheet.absoluteFill}
            />
            <View style={[styles.tabContainer, { paddingBottom }]}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    if (route.name === 'Debug') return null;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TabItem
                            key={index}
                            isFocused={isFocused}
                            label={label as string}
                            options={options}
                            onPress={onPress}
                            onLongPress={onLongPress}
                        />
                    );
                })}
            </View>
        </View>
    );
}

function TabItem({ isFocused, label, options, onPress, onLongPress }: any) {
    const animation = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animation, {
            toValue: isFocused ? 1 : 0,
            duration: 300,
            useNativeDriver: false, // Flex animation requires JS driver
        }).start();
    }, [isFocused]);

    const flex = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.5], // Active tab is 2.5x wider
    });

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', '#A05040'], // Terracotta color from screenshot
    });

    const iconColor = isFocused ? '#FFFFFF' : theme.colors.text.muted; // White when active

    // Label Opacity, Width and Translate
    const labelOpacity = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1]
    });

    const labelWidth = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 100] // Max width for label
    });

    const labelMarginLeft = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 8]
    });

    const textColor = isFocused ? '#FFFFFF' : theme.colors.text.primary;

    return (
        <AnimatedTouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            style={[
                styles.tabItem,
                {
                    flex,
                    backgroundColor
                }
            ]}
            activeOpacity={0.8}
        >
            <View style={styles.contentContainer}>
                {options.tabBarIcon && options.tabBarIcon({
                    focused: isFocused,
                    color: iconColor,
                    size: 24
                })}

                <Animated.View style={{
                    opacity: labelOpacity,
                    maxWidth: labelWidth,
                    marginLeft: labelMarginLeft,
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    <Text numberOfLines={1} style={[styles.label, { color: textColor }]}>
                        {label}
                    </Text>
                </Animated.View>
            </View>
        </AnimatedTouchableOpacity>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        // Remove absolute positioning to prevent overlap
        elevation: 0,
        backgroundColor: 'transparent', // Handled by BlurView
        borderTopWidth: 0,
        overflow: 'hidden',
    },
    tabContainer: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    tabItem: {
        height: 50, // Pill height
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25, // Round pill
        marginHorizontal: 4, // Spacing between pills
        flexDirection: 'row', // Icon + Text row
        overflow: 'hidden'
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        includeFontPadding: false, // Android specific cleanup
        textAlignVertical: 'center', // Android specific cleanup
    }
});
