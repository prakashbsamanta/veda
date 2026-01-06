import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing, Keyboard } from 'react-native';
import { ChevronDown, Search, Check } from 'lucide-react-native';
import { theme } from '../../theme';
import { BlurView } from 'expo-blur';

interface AnimatedDropdownProps {
    label: string;
    options: string[];
    selected: string;
    onSelect: (option: string) => void;
    placeholder?: string;
}

export default function AnimatedDropdown({ label, options, selected, onSelect, placeholder = "Search..." }: AnimatedDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);

    // Animation definition
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setFilteredOptions(
            options.filter(opt => opt.toLowerCase().includes(searchText.toLowerCase()))
        );
    }, [searchText, options]);

    useEffect(() => {
        Animated.timing(animation, {
            toValue: isOpen ? 1 : 0,
            duration: 300,
            useNativeDriver: false, // width/height changes cannot use native driver
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }).start();
    }, [isOpen]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchText('');
        } else {
            Keyboard.dismiss();
        }
    };

    const handleSelect = (option: string) => {
        onSelect(option);
        setIsOpen(false);
        setSearchText('');
        Keyboard.dismiss();
    };

    // Interpolations
    const heightInterpolation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 200] // Max height for dropdown list
    });

    const opacityInterpolation = animation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1]
    });

    const rotateInterpolation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.dropdownWrapper}>
                {/* Trigger Button */}
                <TouchableOpacity
                    testID="dropdown-trigger"
                    activeOpacity={0.8}
                    style={[styles.trigger, isOpen && styles.triggerActive]}
                    onPress={toggleDropdown}
                >
                    <Text style={styles.selectedText}>{selected || "Select..."}</Text>
                    <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
                        <ChevronDown size={20} color={isOpen ? theme.colors.accent.primary : theme.colors.text.muted} />
                    </Animated.View>
                </TouchableOpacity>

                {/* Expanded Content */}
                <Animated.View style={[styles.dropdownContent, { height: heightInterpolation, opacity: opacityInterpolation }]}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                    <View style={styles.searchContainer}>
                        <Search size={16} color={theme.colors.text.muted} style={styles.searchIcon} />
                        <TextInput
                            testID="dropdown-search-input"
                            style={styles.searchInput}
                            placeholder={placeholder}
                            placeholderTextColor={theme.colors.text.muted}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>

                    <View style={styles.listContainer}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    testID={`dropdown-option-${option}`}
                                    style={[
                                        styles.optionItem,
                                        selected === option && styles.optionSelected
                                    ]}
                                    onPress={() => handleSelect(option)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selected === option && styles.optionTextSelected
                                    ]}>
                                        {option}
                                    </Text>
                                    {selected === option && (
                                        <Check size={16} color={theme.colors.accent.primary} />
                                    )}
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.noResults}>
                                <Text style={styles.noResultsText}>No matches found</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        zIndex: 1000,
    },
    label: {
        color: theme.colors.text.muted,
        fontSize: theme.typography.size.md,
        marginBottom: 8,
    },
    dropdownWrapper: {
        overflow: 'hidden',
        borderRadius: 12,
        backgroundColor: theme.colors.background.secondary,
        borderColor: theme.colors.border.subtle,
        borderWidth: 1,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: 'transparent',
    },
    triggerActive: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.subtle,
    },
    selectedText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.size.md,
        fontWeight: '600',
    },
    dropdownContent: {
        overflow: 'hidden',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        margin: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: theme.colors.text.primary,
        fontSize: 14,
        padding: 0,
    },
    listContainer: {
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    optionSelected: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    optionText: {
        color: theme.colors.text.secondary,
        fontSize: 14,
    },
    optionTextSelected: {
        color: theme.colors.accent.primary,
        fontWeight: '600',
    },
    noResults: {
        padding: 12,
        alignItems: 'center',
    },
    noResultsText: {
        color: theme.colors.text.muted,
        fontStyle: 'italic',
        fontSize: 12,
    }
});
