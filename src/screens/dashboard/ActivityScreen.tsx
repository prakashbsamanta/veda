import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Trash2, FileText, CheckSquare, DollarSign, Plus } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { activityService, ActivityItem } from '../../services/database/ActivityService';
import { useFocusEffect } from '@react-navigation/native';
import LogActivityModal from '../../components/LogActivityModal';

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
                <Plus color="#1C1C1E" size={24} />
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }: { item: ActivityItem }) => (
        <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
                {item.type === 'note' && <FileText color="#E5D0AC" size={20} />}
                {item.type === 'task' && <CheckSquare color="#4A90E2" size={20} />}
                {item.type === 'expense' && <DollarSign color="#FF453A" size={20} />}
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
                <Trash2 color="#666" size={18} />
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
    container: { flex: 1, backgroundColor: '#1C1C1E' },
    content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#E5D0AC' },
    addButton: {
        backgroundColor: '#E5D0AC',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    activityCard: {
        flexDirection: 'row',
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
        gap: 12
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    activityContent: { flex: 1 },
    activityTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    activityDesc: { color: '#888', fontSize: 12, marginTop: 2 },
    activityDate: { color: '#666', fontSize: 10, marginTop: 4 },
    activityAmount: { color: '#FF453A', fontWeight: 'bold', marginRight: 8 },
    deleteButton: { padding: 4 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#666', fontStyle: 'italic' }
});
