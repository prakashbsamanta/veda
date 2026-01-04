import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth/AuthService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../../types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { MessageCircle, Activity, Terminal } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { activityService } from '../../services/database/ActivityService';
import { ActivityItem } from '../../types';

import LogActivityModal from '../../components/LogActivityModal';
import { theme } from '../../theme';

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
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.transparent.accent_subtle }]}>
                            <MessageCircle color={theme.colors.accent.primary} size={32} />
                        </View>
                        <Text style={styles.actionText}>Ask Veda</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => setIsActivityModalVisible(true)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.transparent.blue_subtle }]}>
                            <Activity color={theme.colors.accent.secondary} size={32} />
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
                                    {item.type === 'note' && <Activity color={theme.colors.accent.primary} size={16} />}
                                    {item.type === 'task' && <Activity color={theme.colors.accent.secondary} size={16} />}
                                    {item.type === 'expense' && <Activity color={theme.colors.accent.error} size={16} />}
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
        backgroundColor: theme.colors.background.primary,
    },
    content: {
        padding: theme.spacing.lg,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm + 4, // 12
    },
    animationContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    greeting: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.text.muted,
    },
    userName: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    logoutButton: {
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.spacing.sm,
    },
    logoutText: {
        color: theme.colors.accent.error,
        fontWeight: '500',
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    actionCard: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.spacing.md,
        alignItems: 'center',
        gap: theme.spacing.sm + 4, // 12
    },
    iconContainer: {
        padding: 12,
        borderRadius: 24,
    },
    actionText: {
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    summaryCard: {
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.lg,
        borderRadius: theme.spacing.md,
    },
    summaryText: {
        color: theme.colors.text.muted,
        fontStyle: 'italic',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    seeAllText: {
        color: theme.colors.accent.primary,
        fontSize: theme.typography.size.md,
    },
    activityList: {
        gap: theme.spacing.sm,
    },
    miniActivityCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.secondary,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
    },
    miniIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.transparent.background_subtle,
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
        color: theme.colors.accent.error,
        fontSize: 14,
        fontWeight: 'bold',
    }
});
