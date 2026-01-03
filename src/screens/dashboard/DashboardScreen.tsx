import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth/AuthService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../../navigation/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { MessageCircle, Activity, Terminal } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { activityService, ActivityItem } from '../../services/database/ActivityService';
import LogActivityModal from '../../components/LogActivityModal';

// Navigation type definition
type DashboardScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
    NativeStackNavigationProp<any> // Generic fallback for nested stacks if needed
>;

interface Props {
    navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
    const { user, isAdmin } = useAuthStore();
    const [greeting, setGreeting] = useState('Welcome');
    const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
    const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    const fetchActivities = async () => {
        if (user) {
            const data = await activityService.getRecentActivities(user.uid, 5);
            setRecentActivities(data);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchActivities();
        }, [user])
    );



    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.greetingContainer}>
                    <View style={styles.animationContainer}>
                        <LottieView
                            autoPlay
                            loop
                            style={{ width: 60, height: 60 }}
                            // Using a high-quality "AI/Tech" style animation from official Lottie Github samples (Gradient Line)
                            // User can replace this with any local JSON file.
                            source={{ uri: 'https://raw.githubusercontent.com/airbnb/lottie-web/master/demo/gatinho.json' }}
                        />
                    </View>
                    <View>
                        <Text style={styles.greeting}>{greeting},</Text>
                        <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}!</Text>
                    </View>
                </View>
                {isAdmin && (
                    <TouchableOpacity onPress={() => navigation.navigate('Debug')} style={styles.logoutButton}>
                        <Terminal color="#FF453A" size={24} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Chat')}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(229, 208, 172, 0.1)' }]}>
                            <MessageCircle color="#E5D0AC" size={32} />
                        </View>
                        <Text style={styles.actionText}>Ask Veda</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => setIsActivityModalVisible(true)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(74, 144, 226, 0.1)' }]}>
                            <Activity color="#4A90E2" size={32} />
                        </View>
                        <Text style={styles.actionText}>Log Activity</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recent Activity Summary */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                {recentActivities.length === 0 ? (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryText}>Your daily summary will appear here.</Text>
                    </View>
                ) : (
                    <View style={styles.activityList}>
                        {recentActivities.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.miniActivityCard}
                                onPress={() => {
                                    setSelectedActivity(item);
                                    setIsActivityModalVisible(true);
                                }}
                            >
                                <View style={styles.miniIcon}>
                                    {item.type === 'note' && <Activity color="#E5D0AC" size={16} />}
                                    {item.type === 'task' && <Activity color="#4A90E2" size={16} />}
                                    {item.type === 'expense' && <Activity color="#FF453A" size={16} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.miniTitle}>{item.title}</Text>
                                    <Text style={styles.miniDate}>
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                {item.type === 'expense' && (
                                    <Text style={styles.miniAmount}>-{item.currency} {item.amount}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <LogActivityModal
                visible={isActivityModalVisible}
                onClose={() => {
                    setIsActivityModalVisible(false);
                    setSelectedActivity(null);
                }}
                onSave={fetchActivities}
                initialActivity={selectedActivity}
            />
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Changed to center for better alignment
        marginBottom: 24, // Reduced margin
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    animationContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 16,
        color: '#A1A1AA',
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#E5D0AC',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
    },
    logoutText: {
        color: '#FF453A',
        fontWeight: '500',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        padding: 12,
        borderRadius: 24,
    },
    actionText: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    summaryCard: {
        backgroundColor: '#2C2C2E',
        padding: 24,
        borderRadius: 16,
    },
    summaryText: {
        color: '#A1A1AA',
        fontStyle: 'italic',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        color: '#E5D0AC',
        fontSize: 14,
    },
    activityList: {
        gap: 8,
    },
    miniActivityCard: {
        flexDirection: 'row',
        backgroundColor: '#2C2C2E',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
    },
    miniIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    miniDate: {
        color: '#666',
        fontSize: 10,
    },
    miniAmount: {
        color: '#FF453A',
        fontSize: 14,
        fontWeight: 'bold',
    }
});
