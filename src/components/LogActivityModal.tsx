import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { X, Check, FileText, CheckSquare, DollarSign, Plus, AlarmClock } from 'lucide-react-native';
import { ActivityService, activityService } from '../services/database/ActivityService';
import { useAuthStore } from '../store/authStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { notificationService } from '../services/notifications/NotificationService';

type ActivityType = 'note' | 'task' | 'expense';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: () => void; // Callback to refresh parent list
}

export default function LogActivityModal({ visible, onClose, onSave }: Props) {
    const { user } = useAuthStore();
    const [type, setType] = useState<ActivityType>('note');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Reminder State
    const [hasReminder, setHasReminder] = useState(false);
    const [reminderDate, setReminderDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setAmount('');
        setType('note');
        setHasReminder(false);
        setReminderDate(new Date());
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        if (type === 'expense' && !amount) {
            Alert.alert('Error', 'Please enter an amount');
            return;
        }

        if (!user) return;

        setLoading(true);
        try {
            // Save to Database
            await activityService.createActivity(user.uid, {
                type,
                title: title.trim(),
                description: description.trim(),
                amount: type === 'expense' ? parseFloat(amount) : undefined,
                currency: 'INR'
            });

            // Schedule Notification if needed
            if (type === 'task' && hasReminder) {
                if (reminderDate > new Date()) {
                    await notificationService.scheduleNotificationAtDate(
                        `Reminder: ${title.trim()}`,
                        description.trim() || "It's time for your task!",
                        reminderDate
                    );
                } else {
                    Alert.alert("Warning", "Reminder time is in the past, no notification set.");
                }
            }

            onSave();
            resetForm();
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to save activity');
        } finally {
            setLoading(false);
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const currentDate = selectedDate;
            // Keep the time from the previous state, only update date
            const newDate = new Date(reminderDate);
            newDate.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            setReminderDate(newDate);
            setShowTimePicker(true); // Open time picker next
        }
    };

    const onChangeTime = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            const currentDate = selectedDate;
            // Combine with date
            const newDate = new Date(reminderDate);
            newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
            setReminderDate(newDate);
        }
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
                    <View style={styles.header}>
                        <Text style={styles.title}>Log New Activity</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X color="#FFF" size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Type Selector */}
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeButton, type === 'note' && styles.typeButtonActive]}
                                onPress={() => setType('note')}
                            >
                                <FileText color={type === 'note' ? '#1C1C1E' : '#E5D0AC'} size={20} />
                                <Text style={[styles.typeText, type === 'note' && styles.typeTextActive]}>Note</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.typeButton, type === 'task' && styles.typeButtonActive]}
                                onPress={() => setType('task')}
                            >
                                <CheckSquare color={type === 'task' ? '#1C1C1E' : '#E5D0AC'} size={20} />
                                <Text style={[styles.typeText, type === 'task' && styles.typeTextActive]}>Task</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                                onPress={() => setType('expense')}
                            >
                                <DollarSign color={type === 'expense' ? '#1C1C1E' : '#E5D0AC'} size={20} />
                                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
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
                                    onChangeText={setTitle}
                                />
                            </View>

                            {type === 'expense' && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Amount (INR)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        placeholderTextColor="#666"
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={setAmount}
                                    />
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Add details (optional)"
                                    placeholderTextColor="#666"
                                    multiline
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>

                            {/* Reminder Section (Only for Tasks) */}
                            {type === 'task' && (
                                <View style={styles.reminderSection}>
                                    <View style={styles.reminderHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <AlarmClock color="#E5D0AC" size={20} />
                                            <Text style={styles.label}>Set Reminder</Text>
                                        </View>
                                        <Switch
                                            testID="reminder-switch"
                                            value={hasReminder}
                                            onValueChange={setHasReminder}
                                            trackColor={{ false: "#2C2C2E", true: "#E5D0AC" }}
                                            thumbColor={hasReminder ? "#1C1C1E" : "#f4f3f4"}
                                        />
                                    </View>

                                    {hasReminder && (
                                        <View>
                                            <TouchableOpacity
                                                style={styles.dateButton}
                                                onPress={() => setShowDatePicker(true)}
                                            >
                                                <Text style={styles.dateText}>
                                                    {reminderDate.toLocaleDateString()} at {reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={reminderDate}
                                            mode="date"
                                            display="default"
                                            onChange={onChangeDate}
                                            minimumDate={new Date()}
                                        />
                                    )}
                                    {showTimePicker && (
                                        <DateTimePicker
                                            value={reminderDate}
                                            mode="time"
                                            display="default"
                                            onChange={onChangeTime}
                                        />
                                    )}
                                </View>
                            )}


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
                                        <Text style={styles.saveButtonText}>Save Entry</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
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
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
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
    typeSelector: {
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
