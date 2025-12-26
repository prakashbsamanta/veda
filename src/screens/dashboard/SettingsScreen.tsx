import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Linking, TextInput } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { authService } from '../../services/auth/AuthService';
import { LogOut, ChevronRight, Brain, Zap, User as UserIcon, Info, Cloud, Check, Loader as Loader2, AlertTriangle, Save } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const { provider, setProvider, openRouterKey, setOpenRouterKey, selectedModel } = useSettingsStore();

    // const [keyInput, setKeyInput] = React.useState(openRouterKey); // Moved to ProviderCard

    // React.useEffect(() => {
    //     setKeyInput(openRouterKey);
    // }, [openRouterKey]);

    // const handleKeySave = () => {
    //     setOpenRouterKey(keyInput);
    //     Alert.alert("Success", "OpenRouter Key Saved");
    // };

    const handleLogout = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await authService.signOut();
                        } catch (e) {
                            Alert.alert("Error", "Failed to log out");
                        }
                    }
                }
            ]
        );
    };

    const ProviderCard = ({ id, name, icon, description }: { id: 'gemini' | 'perplexity' | 'openrouter', name: string, icon: React.ReactNode, description: string }) => {
        const isActive = provider === id;

        const getKeyValue = () => {
            if (id === 'openrouter') return openRouterKey;
            if (id === 'gemini') return useSettingsStore.getState().geminiKey;
            if (id === 'perplexity') return useSettingsStore.getState().perplexityKey;
            return '';
        };

        const setKeyValue = (text: string) => {
            if (id === 'openrouter') setOpenRouterKey(text);
            if (id === 'gemini') useSettingsStore.getState().setGeminiKey(text);
            if (id === 'perplexity') useSettingsStore.getState().setPerplexityKey(text);
        };

        const [localKey, setLocalKey] = React.useState(getKeyValue());
        const [isTesting, setIsTesting] = React.useState(false);
        const [isValidating, setIsValidating] = React.useState(false);

        React.useEffect(() => {
            setLocalKey(getKeyValue());
        }, [provider]);

        const validateFormat = (text: string) => {
            if (!text) return true;
            if (id === 'openrouter' && !text.startsWith('sk-or-')) return false;
            if (id === 'gemini' && !text.startsWith('AIza')) return false;
            if (id === 'perplexity' && !text.startsWith('pplx-')) return false;
            return true;
        };

        const isFormatValid = validateFormat(localKey);

        const handleSave = () => {
            if (!localKey.trim()) {
                Alert.alert("Invalid Key", "Please enter an API Key.");
                return;
            }
            setKeyValue(localKey);
            Alert.alert("Saved", `${name} Key Saved Successfully.`);
        };

        const handleTestConnection = async () => {
            if (!localKey.trim()) {
                Alert.alert("Missing Key", "Please save a key first.");
                return;
            }

            setIsTesting(true);
            const { cloudAIService } = require('../../services/ai/CloudAIService');
            const success = await cloudAIService.testConnection(id, localKey);
            setIsTesting(false);

            if (success) {
                Alert.alert("Connection Successful", `Successfully connected to ${name}!`);
            } else {
                Alert.alert("Connection Failed", `Could not verify key with ${name}. Please check the key and your internet connection.`);
            }
        };

        return (
            <TouchableOpacity
                style={[styles.providerCard, isActive && styles.providerCardActive]}
                onPress={() => setProvider(id)}
                activeOpacity={0.9}
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
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Save size={16} color="#1C1C1E" />
                                <Text style={styles.saveButtonText}>Save Key</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
                    <ProviderCard
                        id="perplexity"
                        name="Perplexity (Sonar)"
                        icon={<Zap color={provider === 'perplexity' ? '#1C1C1E' : '#E5D0AC'} size={24} />}
                        description="Best for real-time web search and up-to-date info."
                    />

                    <ProviderCard
                        id="gemini"
                        name="Google Gemini"
                        icon={<Brain color={provider === 'gemini' ? '#1C1C1E' : '#4A90E2'} size={24} />}
                        description="Great for creative writing."
                    />

                    <ProviderCard
                        id="openrouter"
                        name="OpenRouter (BYOK)"
                        icon={<Cloud color={provider === 'openrouter' ? '#1C1C1E' : '#A855F7'} size={24} />}
                        description="Access any model via your own key."
                    />
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

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut color="#FF453A" size={20} />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>Made with ❤️ by The Forge</Text>
        </ScrollView>
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
        backgroundColor: '#E5D0AC', // Gold background for active
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
        color: '#1C1C1E', // Dark text on gold bg
    },
    providerDesc: {
        fontSize: 12,
        color: '#888', // Make sure this is readable on both backgrounds, or condition it
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
    // OpenRouter Config Styles
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
        color: '#1C1C1E', // Dark because it's inside the active card
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
