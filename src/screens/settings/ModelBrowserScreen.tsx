import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView, Animated } from 'react-native';
import { useSettingsStore, OpenRouterModel } from '../../store/settingsStore';
import { openRouterService, OpenRouterModelDTO } from '../../services/ai/OpenRouterService';
import { Search, Info, X, Check, Cloud } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';

export default function ModelBrowserScreen() {
    const navigation = useNavigation();
    const { selectedModel, setSelectedModel, openRouterKey } = useSettingsStore();

    const [models, setModels] = useState<OpenRouterModelDTO[]>([]);
    const [filteredModels, setFilteredModels] = useState<OpenRouterModelDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [detailModel, setDetailModel] = useState<OpenRouterModelDTO | null>(null);

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setLoading(true);
        try {
            const data = await openRouterService.fetchModels();
            // Sort: Free models first, then by name
            const sorted = data.sort((a, b) => {
                const isAFree = isFree(a);
                const isBFree = isFree(b);
                if (isAFree && !isBFree) return -1;
                if (!isAFree && isBFree) return 1;
                return a.name.localeCompare(b.name);
            });
            setModels(sorted);
            setFilteredModels(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (!text) {
            setFilteredModels(models);
            return;
        }
        const lower = text.toLowerCase();
        const filtered = models.filter(m =>
            m.name.toLowerCase().includes(lower) ||
            m.id.toLowerCase().includes(lower) ||
            (m.description && m.description.toLowerCase().includes(lower))
        );
        setFilteredModels(filtered);
    };

    const isFree = (model: OpenRouterModelDTO) => {
        const prompt = parseFloat(model.pricing.prompt);
        const completion = parseFloat(model.pricing.completion);
        return prompt === 0 && completion === 0;
    };

    const handleSelect = (model: OpenRouterModelDTO) => {
        const mappedModel: OpenRouterModel = {
            id: model.id,
            name: model.name,
            description: model.description,
            context_length: model.context_length,
            pricing: model.pricing
        };
        setSelectedModel(mappedModel);
        setDetailModel(null);
        navigation.goBack();
    };

    const renderItem = ({ item }: { item: OpenRouterModelDTO }) => {
        const free = isFree(item);
        const isSelected = selectedModel?.id === item.id;

        return (
            <TouchableOpacity
                style={[styles.card, isSelected && styles.selectedCard]}
                onPress={() => setDetailModel(item)}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.modelName} numberOfLines={1}>{item.name.replace(':free', '')}</Text>
                    {free && <View style={styles.freeBadge}><Text style={styles.freeText}>FREE</Text></View>}
                    {isSelected && <View style={styles.selectedBadge}><Check size={12} color={theme.colors.text.inverse} /></View>}
                </View>

                <Text style={styles.modelId} numberOfLines={1}>{item.id}</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoText}>
                        Ctx: {Math.round(item.context_length / 1024)}k
                    </Text>
                    {!free && (
                        <Text style={styles.priceText}>
                            ${(parseFloat(item.pricing.prompt) * 1000000).toFixed(2)} / 1M
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} testID="close-browser-btn">
                    <X color={theme.colors.text.secondary} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Browse Models</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Search color={theme.colors.text.muted} size={20} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search 'DeepSeek', 'Llama'..."
                    placeholderTextColor={theme.colors.text.muted}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.accent.primary} />
                    <Text style={styles.loadingText}>Fetching models from OpenRouter...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredModels}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={15}
                />
            )}

            {/* Detail Modal */}
            <Modal
                visible={!!detailModel}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setDetailModel(null)}
                testID="model-detail-modal"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{detailModel?.name}</Text>
                            <TouchableOpacity onPress={() => setDetailModel(null)} testID="close-modal-btn">
                                <X color={theme.colors.text.muted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.tagRow}>
                                {detailModel && isFree(detailModel) && (
                                    <View style={styles.freeBadgeLarge}>
                                        <Text style={styles.freeTextLarge}>Free</Text>
                                    </View>
                                )}
                                <View style={styles.ctxBadge}>
                                    <Text style={styles.ctxText}>{Math.round((detailModel?.context_length || 0) / 1000)}k Context</Text>
                                </View>
                            </View>

                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.description}>
                                {detailModel?.description || "No description provided."}
                            </Text>

                            <Text style={styles.sectionTitle}>Pricing (per 1M tokens)</Text>
                            <View style={styles.priceRow}>
                                <View>
                                    <Text style={styles.priceLabel}>Input</Text>
                                    <Text style={styles.priceValue}>
                                        ${(parseFloat(detailModel?.pricing.prompt || '0') * 1000000).toFixed(4)}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.priceLabel}>Output</Text>
                                    <Text style={styles.priceValue}>
                                        ${(parseFloat(detailModel?.pricing.completion || '0') * 1000000).toFixed(4)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.modelIdFull}>{detailModel?.id}</Text>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => detailModel && handleSelect(detailModel)}
                        >
                            <Text style={styles.selectButtonText}>Select Model</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: theme.colors.background.secondary,
    },
    title: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        margin: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12,
        borderRadius: theme.spacing.sm + 4,
        gap: theme.spacing.sm + 4,
    },
    searchInput: {
        flex: 1,
        color: theme.colors.text.secondary,
        fontSize: theme.typography.size.md,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: theme.colors.text.muted,
        marginTop: 12,
    },
    listContent: {
        padding: theme.spacing.md,
        gap: theme.spacing.sm + 4,
    },
    card: {
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.spacing.sm + 4,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: theme.colors.accent.primary,
        backgroundColor: theme.colors.transparent.accent_subtle,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    modelName: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
        flex: 1,
    },
    modelId: {
        color: theme.colors.text.muted,
        fontSize: theme.typography.size.sm,
        marginBottom: 8,
    },
    freeBadge: {
        backgroundColor: theme.colors.accent.success,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    freeText: {
        color: '#065F46', // Keeping this for now as it's specific to the badge contrast, or could use inverse text on success
        fontSize: 10,
        fontWeight: 'bold',
    },
    selectedBadge: {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: 10,
        padding: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoText: {
        color: theme.colors.text.muted,
        fontSize: theme.typography.size.sm,
    },
    priceText: {
        color: theme.colors.text.muted,
        fontSize: theme.typography.size.sm,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background.primary,
        height: '70%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
        flex: 1,
    },
    modalBody: {
        flex: 1,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    freeBadgeLarge: {
        backgroundColor: theme.colors.accent.success,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    freeTextLarge: {
        color: '#065F46',
        fontWeight: 'bold',
    },
    ctxBadge: {
        backgroundColor: theme.colors.background.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    ctxText: {
        color: theme.colors.accent.primary,
    },
    sectionTitle: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 16,
    },
    description: {
        color: theme.colors.text.muted,
        lineHeight: 22,
        fontSize: 14,
    },
    priceRow: {
        flexDirection: 'row',
        gap: 32,
        backgroundColor: theme.colors.background.secondary,
        padding: 16,
        borderRadius: 12,
    },
    priceLabel: {
        color: theme.colors.text.muted,
        fontSize: 12,
        marginBottom: 4,
    },
    priceValue: {
        color: theme.colors.text.secondary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    modelIdFull: {
        color: '#444',
        fontSize: 12,
        marginTop: 24,
        fontFamily: 'Courier',
    },
    selectButton: {
        backgroundColor: theme.colors.accent.primary,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    selectButtonText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
