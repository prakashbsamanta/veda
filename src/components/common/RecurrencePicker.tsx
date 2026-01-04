import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { RecurrenceFrequency, RecurrenceRule } from '../../types';
import { theme } from '../../theme';

interface RecurrenceOptionsProps {
    selectedRule?: RecurrenceRule;
    onSelect: (rule: RecurrenceRule) => void;
}

const OPTIONS: { id: RecurrenceFrequency; label: string }[] = [
    { id: 'none', label: 'Does not repeat' },
    { id: 'daily', label: 'Every Day' },
    { id: 'weekly', label: 'Every Week' },
    { id: 'monthly', label: 'Every Month' },
    { id: 'yearly', label: 'Every Year' },
    { id: 'custom', label: 'Custom...' },
];

export default function RecurrenceOptions({ selectedRule, onSelect }: RecurrenceOptionsProps) {
    const selectedType = selectedRule?.frequency || 'none';
    const [showCustomView, setShowCustomView] = useState(false);
    const [customInterval, setCustomInterval] = useState('1');
    const [customFrequency, setCustomFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

    const handleSelectOption = (type: RecurrenceFrequency) => {
        if (type === 'custom') {
            setShowCustomView(true);
        } else {
            onSelect({ frequency: type });
        }
    };

    const handleCustomConfirm = () => {
        onSelect({
            frequency: customFrequency,
            interval: parseInt(customInterval) || 1
        });
        setShowCustomView(false);
    };

    if (showCustomView) {
        return (
            <View style={styles.container}>
                <View style={styles.customHeader}>
                    <TouchableOpacity onPress={() => setShowCustomView(false)} style={styles.backButton}>
                        <ChevronLeft color={theme.colors.accent.primary} size={24} />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.customTitle}>Custom</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.inputRow}>
                    <Text style={styles.label}>Repeat every</Text>
                    <TextInput
                        style={styles.intervalInput}
                        value={customInterval}
                        onChangeText={setCustomInterval}
                        keyboardType="number-pad"
                        maxLength={2}
                    />
                </View>

                <View style={styles.frequencyList}>
                    {['daily', 'weekly', 'monthly', 'yearly'].map((freq) => (
                        <TouchableOpacity
                            key={freq}
                            style={[styles.freqChip, customFrequency === freq && styles.freqChipActive]}
                            onPress={() => setCustomFrequency(freq as any)}
                        >
                            <Text style={[styles.freqText, customFrequency === freq && styles.freqTextActive]}>
                                {freq.charAt(0).toUpperCase() + freq.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity onPress={handleCustomConfirm} style={styles.confirmButton}>
                    <Text style={styles.confirmText}>Set Custom Rule</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.optionsList}>
                {OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.id}
                        style={styles.optionItem}
                        onPress={() => handleSelectOption(opt.id)}
                    >
                        <View style={styles.optionLeft}>
                            {selectedType === opt.id && <Check color={theme.colors.accent.primary} size={20} />}
                            <Text style={[styles.optionLabel, selectedType === opt.id && styles.optionLabelActive]}>
                                {opt.label}
                            </Text>
                        </View>
                        {opt.id === 'custom' && <ChevronRight color={theme.colors.text.muted} size={20} />}
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    optionsList: {
        gap: theme.spacing.sm,
        paddingBottom: 20,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: 12,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionLabel: {
        color: theme.colors.text.muted,
        fontSize: theme.typography.size.md,
    },
    optionLabelActive: {
        color: theme.colors.text.secondary,
        fontWeight: 'bold',
    },
    // Custom View Styles
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xl,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: theme.colors.accent.primary,
        fontSize: 16,
    },
    customTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: theme.spacing.xl,
    },
    label: {
        color: theme.colors.text.secondary,
        fontSize: 16,
    },
    intervalInput: {
        backgroundColor: theme.colors.background.secondary,
        color: theme.colors.text.secondary,
        fontSize: 18,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        width: 60,
        textAlign: 'center',
    },
    frequencyList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 32,
    },
    freqChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: theme.colors.background.secondary,
        borderWidth: 1,
        borderColor: theme.colors.background.tertiary,
    },
    freqChipActive: {
        backgroundColor: theme.colors.accent.primary,
        borderColor: theme.colors.accent.primary,
    },
    freqText: {
        color: theme.colors.text.muted,
    },
    freqTextActive: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: theme.colors.accent.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
