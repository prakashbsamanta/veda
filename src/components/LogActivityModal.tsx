import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { X, Check, FileText, CheckSquare, DollarSign, Plus, AlarmClock, Trash } from 'lucide-react-native';
import { ActivityService, activityService } from '../services/database/ActivityService';
import { ActivityItem } from '../types';

import { useAuthStore } from '../store/authStore';
import { notificationService } from '../services/notifications/NotificationService';
import CustomAlertModal from './common/CustomAlertModal';
import CustomDatePickerModal from './common/CustomDatePickerModal';
import { LocalCategorizer } from '../services/ai/LocalCategorizer';
import { BlurView } from 'expo-blur';
import RecurrencePicker from './common/RecurrencePicker';
import { RecurrenceRule } from '../types';

import { Repeat } from 'lucide-react-native';

type ActivityType = 'note' | 'task' | 'expense';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: () => void; // Callback to refresh parent list
    initialActivity?: ActivityItem | null;
}

export default function LogActivityModal({ visible, onClose, onSave, initialActivity }: Props) {
    const { user } = useAuthStore();
    const [type, setType] = useState<ActivityType>('note');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Reminder State
    const [hasReminder, setHasReminder] = useState(false);
    const [reminderDate, setReminderDate] = useState(new Date());

    // Custom Date Picker State
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    // Recurrence State
    const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>(undefined);
    const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    }>({ visible: false, title: '' });

    const showAlert = (title: string, message?: string, buttons?: any[]) => {
        setAlertConfig({ visible: true, title, message, buttons });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    // Initialize state when modal opens or initialActivity changes
    React.useEffect(() => {
        if (visible) {
            if (initialActivity) {
                setType(initialActivity.type);
                setTitle(initialActivity.title);
                setDescription(initialActivity.description || '');
                setAmount(initialActivity.amount ? initialActivity.amount.toString() : '');
                // Reset reminder state for existing tasks as we don't store reminder specific data in ActivityItem yet
                // For a real app, we'd fetch reminder status
                setHasReminder(false); // For now, reset reminders on edit

                // Parse recurrence if exists
                if (initialActivity.recurrence_rule) {
                    try {
                        setRecurrenceRule(JSON.parse(initialActivity.recurrence_rule));
                    } catch (e) {
                        setRecurrenceRule(undefined);
                    }
                } else {
                    setRecurrenceRule(undefined);
                }
            } else {
                resetForm();
            }
        }
    }, [visible, initialActivity]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAmount('');
        setType('note');
        setHasReminder(false);
        setReminderDate(new Date());
        setDatePickerVisible(false);
        setRecurrenceRule(undefined);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showAlert('Error', 'Please enter a title');
            return;
        }
        if (type === 'expense' && !amount) {
            showAlert('Error', 'Please enter an amount');
            return;
        }

        if (!user) return;

        setLoading(true);
        try {
            // Save to Database
            if (initialActivity) {
                await activityService.updateActivity(initialActivity.id, {
                    type,
                    title: title.trim(),
                    description: description.trim(),
                    amount: type === 'expense' && amount ? parseFloat(amount) : undefined,
                    currency: 'INR',
                    // Don't update category for now as UI doesn't allow changing it easily
                    recurrence_rule: recurrenceRule ? JSON.stringify(recurrenceRule) : undefined
                });
            } else {
                await activityService.createActivity(user.uid, {
                    type,
                    title: title.trim(),
                    description: description.trim(),
                    amount: type === 'expense' ? parseFloat(amount) : undefined,
                    currency: 'INR',
                    recurrence_rule: recurrenceRule ? JSON.stringify(recurrenceRule) : undefined
                });
            }

            // Schedule Notification if needed
            if (type === 'task' && hasReminder) {
                if (reminderDate > new Date()) {
                    await notificationService.scheduleNotificationAtDate(
                        `Reminder: ${title.trim()}`,
                        description.trim() || "It's time for your task!",
                        reminderDate
                    );
                } else {
                    showAlert("Warning", "Reminder time is in the past, no notification set.");
                }
            }

            onSave();
            resetForm();
            onClose();
        } catch (error) {
            showAlert('Error', 'Failed to save activity');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialActivity) return;

        showAlert(
            "Delete Activity",
            "Are you sure you want to delete this activity?",
            [
                { text: "Cancel", style: "cancel", onPress: hideAlert },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await activityService.deleteActivity(initialActivity.id);
                            onSave();
                            resetForm();
                            onClose();
                            hideAlert();
                        } catch (error) {
                            showAlert('Error', 'Failed to delete activity', [{ text: 'OK', onPress: hideAlert }]);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

                    <View style={styles.header}>
                        <Text style={styles.title}>{initialActivity ? 'Edit Activity' : 'Log Activity'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color="#FFF" size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Auto-detected Type Indicator */}
                        <View style={styles.typeIndicatorContainer}>
                            <Text style={styles.typeLabel}>Categorized as:</Text>
                            <TouchableOpacity
                                style={[styles.typeBadge, {
                                    backgroundColor: type === 'expense' ? 'rgba(255, 69, 58, 0.2)' :
                                        type === 'task' ? 'rgba(74, 144, 226, 0.2)' : 'rgba(229, 208, 172, 0.2)',
                                    borderColor: type === 'expense' ? '#FF453A' :
                                        type === 'task' ? '#4A90E2' : '#E5D0AC'
                                }]}
                                onPress={() => {
                                    // Cycle types on click or show alert? Cycling is easy.
                                    const next = type === 'note' ? 'task' : type === 'task' ? 'expense' : 'note';
                                    setType(next);
                                }}
                            >
                                {type === 'note' && <FileText size={14} color="#E5D0AC" />}
                                {type === 'task' && <CheckSquare size={14} color="#4A90E2" />}
                                {type === 'expense' && <DollarSign size={14} color="#FF453A" />}
                                <Text style={[styles.typeBadgeText, {
                                    color: type === 'expense' ? '#FF453A' :
                                        type === 'task' ? '#4A90E2' : '#E5D0AC'
                                }]}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="What's this about?"
                                    placeholderTextColor="#666"
                                    value={title}
                                    onChangeText={(text) => {
                                        setTitle(text);
                                        // Simple heuristic: If type is 'note' (default), try to guess.
                                        // Don't override if user already set specific fields like Amount/Reminder
                                        if (!amount && !hasReminder && !initialActivity) {
                                            const suggested = LocalCategorizer.suggestType(text);
                                            if (suggested !== type) setType(suggested);
                                        }
                                    }}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Add details (categories, tags, etc.)"
                                    placeholderTextColor="#666"
                                    multiline
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>

                            {/* Unified Options Section */}
                            <Text style={styles.sectionLabel}>Details</Text>

                            {/* Amount Field - Always visible but optional */}
                            <View style={styles.inputGroup}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <DollarSign size={16} color="#A1A1AA" />
                                    <Text style={styles.label}>Amount (INR)</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={(val) => {
                                        setAmount(val);
                                        if (val && parseFloat(val) > 0) {
                                            setType('expense');
                                        } else if (!val && !hasReminder) {
                                            // Revert to note if cleared? detailed logic might be annoying.
                                            // Let's stick to: Input -> Sets Type. Clearing doesn't necessarily unset it.
                                        }
                                    }}
                                />
                            </View>

                            {/* Reminder Section - Always visible */}
                            <View style={styles.reminderSection}>
                                <View style={styles.reminderHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <AlarmClock color="#E5D0AC" size={20} />
                                        <Text style={styles.label}>Set Reminder</Text>
                                    </View>
                                    <Switch
                                        testID="reminder-switch"
                                        value={hasReminder}
                                        onValueChange={(val) => {
                                            setHasReminder(val);
                                            if (val) setType('task');
                                            // If turned off, and no amount, maybe revert to note? 
                                            // Keep it simple. specific action -> specific type.
                                        }}
                                        trackColor={{ false: "#2C2C2E", true: "#E5D0AC" }}
                                        thumbColor={hasReminder ? "#1C1C1E" : "#f4f3f4"}
                                    />
                                </View>

                                {hasReminder && (
                                    <View style={{ gap: 8 }}>
                                        <TouchableOpacity
                                            testID="date-picker-button"
                                            style={[styles.dateButton, {
                                                backgroundColor: recurrenceRule?.frequency !== 'none' && recurrenceRule ? '#E5D0AC' : '#2C2C2E'
                                            }]}
                                            onPress={() => setDatePickerVisible(true)}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                {recurrenceRule?.frequency !== 'none' && recurrenceRule ? (
                                                    <Repeat size={16} color="#1C1C1E" />
                                                ) : (
                                                    <AlarmClock size={16} color="#AAAAAA" />
                                                )}
                                                <Text style={[
                                                    styles.dateText,
                                                    recurrenceRule?.frequency !== 'none' && recurrenceRule && { color: '#1C1C1E', fontWeight: 'bold' }
                                                ]}>
                                                    {reminderDate.toLocaleDateString()} at {reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                            {recurrenceRule?.frequency !== 'none' && recurrenceRule && (
                                                <Text style={{ fontSize: 10, color: '#1C1C1E', marginTop: 2 }}>
                                                    Repeats {recurrenceRule.frequency}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>


                            <TouchableOpacity
                                style={[styles.saveButton, loading && styles.disabledButton]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#1C1C1E" />
                                ) : (
                                    <>
                                        <Plus color="#1C1C1E" size={24} />
                                        <Text style={styles.saveButtonText}>{initialActivity ? 'Update Entry' : 'Save Entry'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {initialActivity && (
                                <TouchableOpacity
                                    style={[styles.deleteButton, loading && styles.disabledButton]}
                                    onPress={handleDelete}
                                    disabled={loading}
                                >
                                    <Trash color="#FF453A" size={20} />
                                    <Text style={styles.deleteButtonText}>Delete Activity</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>
                <CustomAlertModal
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    buttons={alertConfig.buttons}
                    onClose={hideAlert}
                />
                <CustomDatePickerModal
                    visible={datePickerVisible}
                    initialDate={reminderDate}
                    mode="datetime"
                    minDate={new Date()}
                    onClose={() => setDatePickerVisible(false)}
                    onSelect={(date) => {
                        setReminderDate(date);
                    }}
                    recurrenceRule={recurrenceRule}
                    onRecurrenceChange={setRecurrenceRule}
                />
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'rgba(28, 28, 30, 0.7)', // Semi-transparent for blur fallback or tint
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden', // Need this for BlurView to respect border radius
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    typeIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12
    },
    typeLabel: {
        color: '#666',
        fontSize: 14,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        gap: 6
    },
    typeBadgeText: {
        fontWeight: '600',
        fontSize: 13
    },
    sectionLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4
    },
    typeSelector: { // Keeping these for now just in case, but they are unused in new layout
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#2C2C2E',
        gap: 8,
        borderWidth: 1,
        borderColor: '#2C2C2E'
    },
    typeButtonActive: {
        backgroundColor: '#E5D0AC',
        borderColor: '#E5D0AC'
    },
    typeText: {
        color: '#E5D0AC',
        fontWeight: 'bold',
        fontSize: 14
    },
    typeTextActive: {
        color: '#1C1C1E'
    },
    form: {
        gap: 20,
        paddingBottom: 40 // Extra padding for safe area
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: '#A1A1AA',
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 12,
        color: '#FFFFFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top'
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: '#E5D0AC',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        gap: 8
    },
    deleteButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 69, 58, 0.3)'
    },
    deleteButtonText: {
        color: '#FF453A',
        fontWeight: 'bold',
        fontSize: 16
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#1C1C1E',
        fontWeight: 'bold',
        fontSize: 16
    },
    reminderSection: {
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 12,
        gap: 12
    },
    reminderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dateButton: {
        backgroundColor: '#1C1C1E',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5D0AC'
    },
    dateText: {
        color: '#E5D0AC',
        fontWeight: '500',
        fontSize: 16
    }
});
