import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth/AuthService';
import { LogOut, Key, Globe, Brain, Info, Check, Code, ExternalLink, Zap, Cloud, Save, AlertTriangle, Loader as Loader2, ChevronRight } from 'lucide-react-native';
import { useSettingsStore } from '../../store/settingsStore';
import CustomAlertModal from '../../components/common/CustomAlertModal';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const {
        provider,
        openRouterKey,
        geminiKey,
        perplexityKey,
        selectedModel,
        setProvider,
        setOpenRouterKey,
        setGeminiKey,
        setPerplexityKey
    } = useSettingsStore();

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

    const handleLogout = () => {
        showAlert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel", onPress: hideAlert },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await authService.signOut();
                            hideAlert();
                        } catch (error) {
                            showAlert("Error", "Failed to log out", [{ text: "OK", onPress: hideAlert }]);
                        }
                    }
                }
            ]
        );
    };

    // Helper to render provider cards
    const renderProviderCard = (id: 'gemini' | 'perplexity' | 'openrouter', name: string, icon: React.ReactNode, description: string) => {
        const isActive = provider === id;
        const [localKey, setLocalKey] = useState('');
        const [isTesting, setIsTesting] = useState(false);

        // Sync local key with store when provider or keys change
        useEffect(() => {
            if (id === 'openrouter') setLocalKey(openRouterKey || '');
            else if (id === 'gemini') setLocalKey(geminiKey || '');
            else if (id === 'perplexity') setLocalKey(perplexityKey || '');
        }, [id, openRouterKey, geminiKey, perplexityKey]);

        const validateFormat = (text: string) => {
            if (!text) return true;
            if (id === 'openrouter' && !text.startsWith('sk-or-')) return false;
            // if (id === 'gemini' && !text.startsWith('AIza')) return false; // Gemini keys vary
            if (id === 'perplexity' && !text.startsWith('pplx-')) return false;
            return true;
        };

        const isFormatValid = validateFormat(localKey);

        const handleSave = () => {
            if (!localKey.trim()) {
                showAlert("Invalid Key", "Please enter an API Key.", [{ text: "OK", onPress: hideAlert }]);
                return;
            }
            if (id === 'openrouter') setOpenRouterKey(localKey);
            else if (id === 'gemini') setGeminiKey(localKey);
            else if (id === 'perplexity') setPerplexityKey(localKey);

            showAlert("Saved", `${name} Key Saved Successfully.`, [{ text: "OK", onPress: hideAlert }]);
        };

        const handleTestConnection = async () => {
            if (!localKey.trim()) {
                showAlert("Missing Key", "Please save a key first.", [{ text: "OK", onPress: hideAlert }]);
                return;
            }

            setIsTesting(true);
            try {
                // Determine URL based on provider
                let url = '';
                let headers: any = {};

                if (id === 'openrouter') {
                    url = 'https://openrouter.ai/api/v1/auth/key';
                    headers = { 'Authorization': `Bearer ${localKey}` };
                } else if (id === 'perplexity') {
                    url = 'https://api.perplexity.ai/models'; // Simple endpoint to test auth
                    headers = { 'Authorization': `Bearer ${localKey}` };
                } else if (id === 'gemini') {
                    // Gemini usually requires a query param key, but for generic test we might need a specific endpoint
                    // For now, let's assume if we saved it, it's "verified" enough or mock a call.
                    // Or call a simple list models endpoint
                    url = `https://generativelanguage.googleapis.com/v1beta/models?key=${localKey}`;
                }

                const response = await fetch(url, { method: 'GET', headers });

                if (response.ok) {
                    showAlert("Connection Successful", `Successfully connected to ${name}!`, [{ text: "OK", onPress: hideAlert }]);
                } else {
                    showAlert("Connection Failed", `Could not verify key. Status: ${response.status}`, [{ text: "OK", onPress: hideAlert }]);
                }
            } catch (error) {
                showAlert("Connection Error", "Network request failed.", [{ text: "OK", onPress: hideAlert }]);
            } finally {
                setIsTesting(false);
            }
        };

        return (
            <TouchableOpacity
                style={[styles.providerCard, isActive && styles.providerCardActive]}
                onPress={() => setProvider(id)}
                activeOpacity={0.9}
                key={id}
            >
                <View style={styles.providerHeader}>
                    <View style={styles.providerIconContainer}>
                        {icon}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.providerName, isActive && styles.textActive]}>{name}</Text>
                        <Text style={[styles.providerDesc, isActive && styles.textActiveDesc]}>{description}</Text>
                    </View>
                    {isActive && (
                        <View style={styles.activeBadge}>
                            <View style={styles.activeDot} />
                        </View>
                    )}
                </View>

                {isActive && (
                    <View style={styles.configContainer}>
                        <View style={styles.divider} />

                        <Text style={styles.configLabel}>API Key (Required)</Text>

                        <View style={[styles.inputRow, !isFormatValid && { borderColor: '#FF453A', borderWidth: 1 }]}>
                            <TextInput
                                style={styles.keyInput}
                                placeholder={id === 'openrouter' ? "sk-or-..." : "Paste your API Key..."}
                                placeholderTextColor={theme.colors.text.muted}
                                secureTextEntry
                                value={localKey}
                                onChangeText={setLocalKey}
                                autoCapitalize="none"
                            />
                        </View>

                        {!isFormatValid && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 }}>
                                <AlertTriangle size={14} color="#FF453A" />
                                <Text style={{ color: '#FF453A', fontSize: 12 }}>Invalid key format</Text>
                            </View>
                        )}

                        <View style={styles.actionButtons}>
                            <TouchableOpacity testID="save-key-btn" style={styles.saveButton} onPress={handleSave}>
                                <Save size={16} color={theme.colors.text.inverse} />
                                <Text style={styles.saveButtonText}>Save Key</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                testID="test-connection-btn"
                                style={[styles.testButton, isTesting && { opacity: 0.7 }]}
                                onPress={handleTestConnection}
                                disabled={isTesting}
                            >
                                {isTesting ? <Loader2 size={16} color={theme.colors.text.secondary} /> : <Zap size={16} color={theme.colors.text.secondary} />}
                                <Text style={styles.testButtonText}>{isTesting ? "Testing..." : "Test Connection"}</Text>
                            </TouchableOpacity>
                        </View>

                        {id === 'openrouter' && (
                            <>
                                <Text style={[styles.configLabel, { marginTop: 12 }]}>Active Model</Text>
                                <TouchableOpacity
                                    style={styles.modelSelector}
                                    onPress={() => navigation.navigate('ModelBrowser')}
                                >
                                    <View>
                                        <Text style={styles.selectedModelName}>
                                            {selectedModel ? selectedModel.name : "Select a Model"}
                                        </Text>
                                        <Text style={styles.selectedModelId}>
                                            {selectedModel ? selectedModel.id : "Tap to browse..."}
                                        </Text>
                                    </View>
                                    <ChevronRight color={theme.colors.text.muted} size={20} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.screenTitle}>Settings</Text>

                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile</Text>
                    <View style={styles.profileCard}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.userName}>
                                {user?.displayName || user?.email?.split('@')[0] || 'User'}
                            </Text>
                            <Text style={styles.userEmail}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

                {/* AI Provider Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AI Brain</Text>
                    <Text style={styles.sectionSubtitle}>Choose the intelligence engine powering Veda.</Text>

                    <View style={styles.providerGrid}>
                        {renderProviderCard(
                            "perplexity",
                            "Perplexity (Sonar)",
                            <Zap color={provider === 'perplexity' ? theme.colors.text.inverse : theme.colors.accent.primary} size={24} />,
                            "Best for real-time web search and up-to-date info."
                        )}

                        {renderProviderCard(
                            "gemini",
                            "Google Gemini",
                            <Brain color={provider === 'gemini' ? theme.colors.text.inverse : theme.colors.accent.secondary} size={24} />,
                            "Great for creative writing."
                        )}

                        {renderProviderCard(
                            "openrouter",
                            "OpenRouter (BYOK)",
                            <Cloud color={provider === 'openrouter' ? theme.colors.text.inverse : '#A855F7'} size={24} />,
                            "Access any model via your own key."
                        )}
                    </View>
                </View>

                {/* General Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconInfo}>
                            <Info color={theme.colors.text.muted} size={20} />
                        </View>
                        <Text style={styles.menuText}>Version</Text>
                        <Text style={styles.versionText}>1.0.0 (Beta)</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity testID="logout-button" style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut color={theme.colors.accent.error} size={20} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>Made with ❤️ by The Forge</Text>
            </ScrollView>

            <CustomAlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={hideAlert}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    content: {
        padding: theme.spacing.lg,
        paddingTop: 60,
        paddingBottom: 40,
    },
    screenTitle: {
        fontSize: theme.typography.size.display,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xl,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    sectionSubtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text.muted,
        marginBottom: theme.spacing.md,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.spacing.md,
        gap: theme.spacing.md,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: theme.typography.size.xxl,
        fontWeight: 'bold',
        color: theme.colors.text.inverse,
    },
    userName: {
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
    },
    userEmail: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text.muted,
    },
    providerGrid: {
        gap: theme.spacing.sm + 4,
    },
    providerCard: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.spacing.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    providerCardActive: {
        backgroundColor: theme.colors.accent.primary,
        borderColor: theme.colors.accent.primary,
    },
    providerHeader: {
        flexDirection: 'row',
        gap: theme.spacing.sm + 4,
        alignItems: 'flex-start',
    },
    providerIconContainer: {
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.transparent.background_subtle,
        borderRadius: theme.spacing.sm,
    },
    providerName: {
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    textActive: {
        color: theme.colors.text.inverse,
    },
    providerDesc: {
        fontSize: theme.typography.size.sm,
        color: '#888',
    },
    textActiveDesc: {
        color: theme.colors.text.inverse,
        opacity: 0.8,
    },
    activeBadge: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.text.inverse,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.text.inverse,
    },
    configContainer: {
        marginTop: theme.spacing.sm + 4,
        paddingTop: theme.spacing.sm + 4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: theme.spacing.sm + 4,
    },
    configLabel: {
        fontSize: theme.typography.size.sm,
        fontWeight: 'bold',
        color: theme.colors.text.inverse,
        marginBottom: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        marginBottom: theme.spacing.sm + 4,
    },
    keyInput: {
        flex: 1,
        paddingVertical: 8,
        color: theme.colors.text.inverse,
    },
    modelSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.4)',
        padding: 10,
        borderRadius: theme.spacing.sm,
    },
    selectedModelName: {
        fontWeight: 'bold',
        color: theme.colors.text.inverse,
        fontSize: theme.typography.size.md,
    },
    selectedModelId: {
        fontSize: 10,
        color: theme.colors.text.inverse,
        opacity: 0.7,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.spacing.sm + 4,
        gap: theme.spacing.sm + 4,
    },
    menuIconInfo: {
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.transparent.background_subtle,
        borderRadius: theme.spacing.sm,
    },
    menuText: {
        flex: 1,
        fontSize: theme.typography.size.lg,
        color: theme.colors.text.secondary,
    },
    versionText: {
        color: theme.colors.text.muted,
        fontSize: theme.typography.size.md,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: 'rgba(255, 69, 58, 0.1)', // Keeping this for specific destructive style
        borderRadius: theme.spacing.sm + 4,
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    logoutText: {
        color: theme.colors.accent.error,
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
    },
    footerText: {
        textAlign: 'center',
        color: theme.colors.text.muted,
        marginTop: theme.spacing.xl,
        fontSize: theme.typography.size.sm,
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm + 4,
        marginBottom: theme.spacing.md,
    },
    saveButton: {
        flex: 1,
        backgroundColor: theme.colors.accent.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: theme.spacing.sm,
        gap: 6,
    },
    saveButtonText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontSize: theme.typography.size.md,
    },
    testButton: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: theme.spacing.sm,
        gap: 6,
    },
    testButtonText: {
        color: theme.colors.text.secondary,
        fontWeight: '600',
        fontSize: theme.typography.size.md,
    }
});
