import { BlurView } from 'expo-blur';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Calendar, Clock, X, Check, Repeat } from 'lucide-react-native';
import CalendarView from './CalendarView';
import TimePickerView from './TimePickerView';
import RecurrenceOptions from './RecurrencePicker';
import { RecurrenceRule } from '../../types';
import { theme } from '../../theme';


interface CustomDatePickerModalProps {
    visible: boolean;
    initialDate?: Date;
    onClose: () => void;
    onSelect: (date: Date) => void;
    mode?: 'date' | 'time' | 'datetime';
    minDate?: Date;
    recurrenceRule?: RecurrenceRule;
    onRecurrenceChange?: (rule: RecurrenceRule) => void;
}

export default function CustomDatePickerModal({
    visible,
    initialDate,
    onClose,
    onSelect,
    mode = 'datetime', // Default to both
    minDate,
    recurrenceRule,
    onRecurrenceChange
}: CustomDatePickerModalProps) {
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
    const [currentTab, setCurrentTab] = useState<'date' | 'time' | 'repeat'>('date');

    useEffect(() => {
        if (visible) {
            setSelectedDate(initialDate || new Date());
            // If mode is only time, default to time tab. Otherwise date.
            if (mode === 'time') setCurrentTab('time');
            else setCurrentTab('date');
        }
    }, [visible, initialDate, mode]);

    const handleConfirm = () => {
        onSelect(selectedDate);
        onClose();
    };

    const formatDatePreview = (date: Date) => {
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTimePreview = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />

                    {/* Header with Tabs */}
                    <View style={styles.header}>
                        <View style={styles.tabs}>
                            {(mode === 'datetime' || mode === 'date') && (
                                <TouchableOpacity
                                    style={[styles.tab, currentTab === 'date' && styles.activeTab]}
                                    onPress={() => setCurrentTab('date')}
                                >
                                    <Calendar color={currentTab === 'date' ? theme.colors.text.inverse : theme.colors.accent.primary} size={18} />
                                    <Text style={[styles.tabText, currentTab === 'date' && styles.activeTabText]}>
                                        {formatDatePreview(selectedDate)}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {(mode === 'datetime' || mode === 'time') && (
                                <TouchableOpacity
                                    style={[styles.tab, currentTab === 'time' && styles.activeTab]}
                                    onPress={() => setCurrentTab('time')}
                                >
                                    <Clock color={currentTab === 'time' ? theme.colors.text.inverse : theme.colors.accent.primary} size={18} />
                                    <Text style={[styles.tabText, currentTab === 'time' && styles.activeTabText]}>
                                        {formatTimePreview(selectedDate)}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Repeat Tab - Only show if callback provided */}
                            {onRecurrenceChange && (
                                <TouchableOpacity
                                    style={[styles.tab, currentTab === 'repeat' && styles.activeTab]}
                                    onPress={() => setCurrentTab('repeat')}
                                >
                                    <Repeat color={currentTab === 'repeat' ? theme.colors.text.inverse : theme.colors.accent.primary} size={18} />
                                    {recurrenceRule && recurrenceRule.frequency !== 'none' && (
                                        <View style={styles.badge} />
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X color={theme.colors.text.muted} size={24} />
                        </TouchableOpacity>
                    </View>

                    {/* Content Body */}
                    <View style={styles.content}>
                        {currentTab === 'date' ? (
                            <CalendarView
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                minDate={minDate}
                            />
                        ) : currentTab === 'time' ? (
                            <TimePickerView
                                selectedDate={selectedDate}
                                onTimeChange={setSelectedDate}
                            />
                        ) : (
                            <RecurrenceOptions
                                selectedRule={recurrenceRule}
                                onSelect={(rule) => onRecurrenceChange?.(rule)}
                            />
                        )}
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Check color={theme.colors.text.inverse} size={20} />
                            <Text style={styles.confirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'rgba(28, 28, 30, 0.8)', // Frosted
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.primary,
        justifyContent: 'space-between',
    },
    tabs: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: theme.colors.background.secondary,
        gap: 8,
    },
    activeTab: {
        backgroundColor: theme.colors.accent.primary,
    },
    tabText: {
        color: theme.colors.accent.primary,
        fontSize: theme.typography.size.sm,
        fontWeight: 'bold',
    },
    activeTabText: {
        color: theme.colors.text.inverse,
    },
    badge: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.text.inverse,
        position: 'absolute',
        top: 6,
        right: 6,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 20,
        height: 380, // Fixed height for consistency
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.primary,
        alignItems: 'flex-end',
    },
    confirmButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.accent.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    confirmText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
