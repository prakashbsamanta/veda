import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react-native';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurrenceRule {
    frequency: RecurrenceType;
    interval?: number;
}

interface RecurrenceOptionsProps {
    selectedRule?: RecurrenceRule;
    onSelect: (rule: RecurrenceRule) => void;
}

const OPTIONS: { id: RecurrenceType; label: string }[] = [
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

    const handleSelectOption = (type: RecurrenceType) => {
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
                        <ChevronLeft color="#E5D0AC" size={24} />
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
                            {selectedType === opt.id && <Check color="#E5D0AC" size={20} />}
                            <Text style={[styles.optionLabel, selectedType === opt.id && styles.optionLabelActive]}>
                                {opt.label}
                            </Text>
                        </View>
                        {opt.id === 'custom' && <ChevronRight color="#666" size={20} />}
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
        gap: 8,
        paddingBottom: 20,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionLabel: {
        color: '#AAAAAA',
        fontSize: 16,
    },
    optionLabelActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    // Custom View Styles
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#E5D0AC',
        fontSize: 16,
    },
    customTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    intervalInput: {
        backgroundColor: '#2C2C2E',
        color: '#FFFFFF',
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
        backgroundColor: '#2C2C2E',
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    freqChipActive: {
        backgroundColor: '#E5D0AC',
        borderColor: '#E5D0AC',
    },
    freqText: {
        color: '#AAAAAA',
    },
    freqTextActive: {
        color: '#1C1C1E',
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#E5D0AC',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmText: {
        color: '#1C1C1E',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
