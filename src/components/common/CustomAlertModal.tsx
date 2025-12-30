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
    onClose?: () => void; // Optional fallback if no buttons provided or background tap
}

export default function CustomAlertModal({ visible, title, message, buttons = [], onClose }: Props) {
    // If no buttons are provided, show a default "OK" button
    const actionButtons = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default', onPress: onClose }];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.alertContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    <View style={styles.buttonContainer}>
                        {actionButtons.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    // Add margin for multiple buttons if needed, or flex
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: '#A1A1AA',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    buttonText: {
        color: '#E5D0AC',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelText: {
        color: '#A1A1AA',
    },
    destructiveText: {
        color: '#FF453A',
    },
});
