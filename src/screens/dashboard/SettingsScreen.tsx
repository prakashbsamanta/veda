import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth/AuthService';
import { LogOut, Key, Globe, Brain, Info, Check, Code, ExternalLink, Zap, Cloud, Save, AlertTriangle, Loader as Loader2, ChevronRight } from 'lucide-react-native';
import { useSettingsStore } from '../../store/settingsStore';
import CustomAlertModal from '../../components/common/CustomAlertModal';
import { useNavigation } from '@react-navigation/native';

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
                                placeholderTextColor="#666"
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
                                <Save size={16} color="#1C1C1E" />
                                <Text style={styles.saveButtonText}>Save Key</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                testID="test-connection-btn"
                                style={[styles.testButton, isTesting && { opacity: 0.7 }]}
                                onPress={handleTestConnection}
                                disabled={isTesting}
                            >
                                {isTesting ? <Loader2 size={16} color="#FFFFFF" /> : <Zap size={16} color="#FFFFFF" />}
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
                                    <ChevronRight color="#666" size={20} />
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
                            <Zap color={provider === 'perplexity' ? '#1C1C1E' : '#E5D0AC'} size={24} />,
                            "Best for real-time web search and up-to-date info."
                        )}

                        {renderProviderCard(
                            "gemini",
                            "Google Gemini",
                            <Brain color={provider === 'gemini' ? '#1C1C1E' : '#4A90E2'} size={24} />,
                            "Great for creative writing."
                        )}

                        {renderProviderCard(
                            "openrouter",
                            "OpenRouter (BYOK)",
                            <Cloud color={provider === 'openrouter' ? '#1C1C1E' : '#A855F7'} size={24} />,
                            "Access any model via your own key."
                        )}
                    </View>
                </View>

                {/* General Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconInfo}>
                            <Info color="#A1A1AA" size={20} />
                        </View>
                        <Text style={styles.menuText}>Version</Text>
                        <Text style={styles.versionText}>1.0.0 (Beta)</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity testID="logout-button" style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut color="#FF453A" size={20} />
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
        backgroundColor: '#1C1C1E',
    },
    content: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#E5D0AC',
        marginBottom: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#A1A1AA',
        marginBottom: 16,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E5D0AC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1C1C1E',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    userEmail: {
        fontSize: 14,
        color: '#A1A1AA',
    },
    providerGrid: {
        gap: 12,
    },
    providerCard: {
        backgroundColor: '#2C2C2E',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    providerCardActive: {
        backgroundColor: '#E5D0AC',
        borderColor: '#E5D0AC',
    },
    providerHeader: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    providerIconContainer: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
    },
    providerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    textActive: {
        color: '#1C1C1E',
    },
    providerDesc: {
        fontSize: 12,
        color: '#888',
    },
    textActiveDesc: {
        color: '#1C1C1E',
        opacity: 0.8,
    },
    activeBadge: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1C1C1E',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#1C1C1E',
    },
    configContainer: {
        marginTop: 12,
        paddingTop: 12,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: 12,
    },
    configLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    keyInput: {
        flex: 1,
        paddingVertical: 8,
        color: '#1C1C1E',
    },
    modelSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.4)',
        padding: 10,
        borderRadius: 8,
    },
    selectedModelName: {
        fontWeight: 'bold',
        color: '#1C1C1E',
        fontSize: 14,
    },
    selectedModelId: {
        fontSize: 10,
        color: '#1C1C1E',
        opacity: 0.7,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    menuIconInfo: {
        padding: 8,
        backgroundColor: 'rgba(161, 161, 170, 0.1)',
        borderRadius: 8,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
    },
    versionText: {
        color: '#666',
        fontSize: 14,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    logoutText: {
        color: '#FF453A',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 32,
        fontSize: 12,
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#E5D0AC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    saveButtonText: {
        color: '#1C1C1E',
        fontWeight: 'bold',
        fontSize: 14,
    },
    testButton: {
        flex: 1,
        backgroundColor: '#2C2C2E',
        borderWidth: 1,
        borderColor: '#4A4A4C',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    testButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    }
});
