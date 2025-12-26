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
                shouldShowBanner: true,
                shouldShowList: true
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
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: { data: 'goes here' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 2
                },
            });
            return true;
        } catch (error) {
            console.log('Error scheduling notification:', error);
            return false;
        }
    }

    public async scheduleNotificationAtDate(title: string, body: string, date: Date) {
        try {
            // Assuming 'logger' is defined elsewhere or will be added. Using console.log for now.
            console.log(`Scheduling notification for ${date.toISOString()}`);
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: date
                },
            });
            return true;
        } catch (error) {
            // Assuming 'logger' is defined elsewhere or will be added. Using console.error for now.
            console.error('Error scheduling scheduled notification:', error);
            return false;
        }
    }

    public async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
}

export const notificationService = NotificationService.getInstance();
