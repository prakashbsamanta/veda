import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Mic, Square } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { cloudAIService } from '../../services/ai/CloudAIService';
import { useAuthStore } from '../../store/authStore';
import { Message } from '../../types/chat';
import { theme } from '../../theme';


export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const { user } = useAuthStore();

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    text: `Hello ${user?.email?.split('@')[0] || 'there'}! I am Veda. How can I help you today?`,
                    sender: 'ai',
                    timestamp: Date.now()
                }
            ]);
        }
        return () => {
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant microphone permission to use voice chat.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(recording);
            recordingRef.current = recording;
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Failed to start recording.');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        setLoading(true);

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            recordingRef.current = null;

            if (!uri) return;

            // Convert to base64
            const base64Audio = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // Optimistic update for UI (optional, maybe just show "Processing audio...")

            const response = await cloudAIService.generateResponseFromAudio(base64Audio);

            // Add AI response directly
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'ai',
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiMsg]);

            // Speak response
            Speech.speak(response.text);

        } catch (error) {
            console.error('Recording/Analysis failed', error);
            Alert.alert('Error', 'Failed to process audio.');
        } finally {
            setLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setLoading(true);

        // Scroll to bottom
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const response = await cloudAIService.generateText(userMsg.text);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'ai',
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiMsg]);

            // Auto-speak response if desired, or maybe valid only for voice mode?
            // For now let's only speak if it came from voice, or maybe just leave it silent for text input.
            // If user wants TTS for text input, we can add a toggle. 
            // Let's keep it silent for text input for now to avoid annoyance.

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm sorry, I encountered an error. Please try again.",
                sender: 'ai',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.aiBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.aiText
                ]}>{item.text}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Veda AI</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                style={styles.list}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity
                        style={[styles.micButton, isRecording && styles.micButtonActive]}
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        disabled={loading}
                    >
                        {isRecording ? (
                            <Square color={theme.colors.text.inverse} size={24} fill={theme.colors.text.inverse} />
                        ) : (
                            <Mic color={loading ? theme.colors.text.muted : theme.colors.accent.primary} size={24} />
                        )}
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder={isRecording ? "Listening..." : "Ask anything..."}
                        placeholderTextColor={theme.colors.text.muted}
                        value={inputText}
                        onChangeText={setInputText}
                        editable={!loading && !isRecording}
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.text.inverse} size="small" />
                        ) : (
                            <Send color={theme.colors.text.inverse} size={20} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.primary,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.accent.primary,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.background.secondary,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: theme.typography.size.lg,
    },
    userText: {
        color: theme.colors.text.inverse,
    },
    aiText: {
        color: theme.colors.text.secondary,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.primary,
        backgroundColor: theme.colors.background.primary,
        gap: 12,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        color: theme.colors.text.secondary,
        fontSize: theme.typography.size.lg,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: theme.colors.accent.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    micButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    micButtonActive: {
        backgroundColor: theme.colors.accent.error,
    }
});
