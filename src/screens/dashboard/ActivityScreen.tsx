import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Trash2, FileText, CheckSquare, DollarSign, Plus } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { activityService } from '../../services/database/ActivityService';
import { ActivityItem } from '../../types';

import { useFocusEffect } from '@react-navigation/native';
import LogActivityModal from '../../components/LogActivityModal';
import { theme } from '../../theme';

export default function ActivityScreen() {
    const { user } = useAuthStore();
    const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const loadActivities = async () => {
        if (!user) return;
        const data = await activityService.getRecentActivities(user.uid, 50); // increased limit
        setRecentActivities(data);
    };

    useFocusEffect(
        React.useCallback(() => {
            loadActivities();
        }, [user])
    );

    const handleDelete = async (id: string) => {
        try {
            await activityService.deleteActivity(id);
            loadActivities();
        } catch (error) {
            Alert.alert('Error', 'Failed to delete');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Activity History</Text>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsModalVisible(true)}
            >
                <Plus color={theme.colors.text.inverse} size={24} />
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }: { item: ActivityItem }) => (
        <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
                {item.type === 'note' && <FileText color={theme.colors.accent.primary} size={20} />}
                {item.type === 'task' && <CheckSquare color={theme.colors.accent.secondary} size={20} />}
                {item.type === 'expense' && <DollarSign color={theme.colors.accent.error} size={20} />}
            </View>
            <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.activityDesc} numberOfLines={1}>{item.description}</Text> : null}
                <Text style={styles.activityDate}>
                    {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            {item.type === 'expense' && (
                <Text style={styles.activityAmount}>-{item.currency} {item.amount}</Text>
            )}
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                <Trash2 color={theme.colors.text.muted} size={18} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={recentActivities}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.content}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No activities logged yet.</Text>
                    </View>
                }
            />

            <LogActivityModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSave={loadActivities}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.primary },
    content: { padding: theme.spacing.lg, paddingTop: 60, paddingBottom: 100 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl
    },
    headerTitle: { fontSize: theme.typography.size.xxl, fontWeight: 'bold', color: theme.colors.text.primary },
    addButton: {
        backgroundColor: theme.colors.accent.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    activityCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.spacing.sm + 4, // 12
        marginBottom: theme.spacing.sm + 2,
        alignItems: 'center',
        gap: theme.spacing.sm + 4
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.transparent.background_subtle,
        justifyContent: 'center',
        alignItems: 'center'
    },
    activityContent: { flex: 1 },
    activityTitle: { color: theme.colors.text.secondary, fontSize: theme.typography.size.lg, fontWeight: '600' },
    activityDesc: { color: theme.colors.text.muted, fontSize: theme.typography.size.sm, marginTop: 2 },
    activityDate: { color: theme.colors.text.muted, fontSize: 10, marginTop: 4 },
    activityAmount: { color: theme.colors.accent.error, fontWeight: 'bold', marginRight: theme.spacing.sm },
    deleteButton: { padding: 4 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: theme.colors.text.muted, fontStyle: 'italic' }
});
