import { BlurView } from 'expo-blur';
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';

interface AlertButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface Props {
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
    onClose?: () => void;
}

export default function CustomAlertModal({ visible, title, message, buttons = [], onClose }: Props) {
    const actionButtons: AlertButton[] = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default', onPress: onClose }];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.alertContainer}>
                    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                    <Text style={styles.title}>{title}</Text>
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    <View style={styles.buttonContainer}>
                        {actionButtons.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                ]}
                                onPress={() => {
                                    if (btn.onPress) btn.onPress();
                                    else if (onClose) onClose();
                                }}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    btn.style === 'cancel' && styles.cancelText,
                                    btn.style === 'destructive' && styles.destructiveText
                                ]}>
                                    {btn.text.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

import { theme } from '../../theme';

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    alertContainer: {
        backgroundColor: 'rgba(28, 28, 30, 0.75)', // Glassy background
        borderRadius: theme.spacing.md,
        padding: theme.spacing.lg,
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        overflow: 'hidden',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    message: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.text.muted,
        marginBottom: theme.spacing.lg,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: theme.spacing.md,
    },
    button: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: 12,
    },
    buttonText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
    },
    cancelText: {
        color: theme.colors.text.muted,
    },
    destructiveText: {
        color: theme.colors.accent.error,
    },
});
