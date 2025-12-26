import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

export class NotificationService {
    private static instance: NotificationService;

    private constructor() {
        this.setupNotificationHandler();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private setupNotificationHandler() {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
    }

    public async registerForPushNotificationsAsync() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            try {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    console.log('Permission not granted for notifications');
                    return;
                }

                // NOTE: We do NOT call getExpoPushTokenAsync() here because:
                // 1. We are using local notifications only for now.
                // 2. Expo Go SDK 53+ has removed support for remote push notifications, causing crashes.
                // For production with remote push, a development build is required.
            } catch (error) {
                console.log('Error requesting notification permissions:', error);
            }
        } else {
            console.log('Must use physical device for Notifications');
        }
    }

    public async scheduleNotification(title: string, body: string, seconds: number) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                color: '#E5D0AC',
            },
            trigger: {
                seconds: seconds,
            },
        });
    }

    public async scheduleNotificationAtDate(title: string, body: string, date: Date) {
        const trigger = date.getTime(); // Timestamp
        // For Expo Notifications, simple Date works too in newer versions, or { date: date }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: {
                date: date
            },
        });
    }

    public async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
}

export const notificationService = NotificationService.getInstance();
