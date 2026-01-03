import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

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
        // Expo Go on Android (SDK 53+) removed expo-notifications native module.
        // Importing it or calling setNotificationHandler might crash.
        // We use dynamic require to avoid top-level crash.
        try {
            const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
            if (isExpoGo && Platform.OS === 'android') {
                // Skip handler setup in Expo Go Android
                return;
            }

            const Notifications = require('expo-notifications');
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true
                }),
            });
        } catch (error) {
            console.log('Failed to set notification handler (likely Expo Go restriction):', error);
        }
    }

    public async registerForPushNotificationsAsync() {
        try {
            const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
            if (isExpoGo && Platform.OS === 'android') {
                console.log("Expo Go detected: Skipping remote notification registration to prevent crash.");
                return;
            }

            const Notifications = require('expo-notifications');

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            if (Device.isDevice) {
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
            } else {
                console.log('Must use physical device for Notifications');
            }
        } catch (error) {
            console.log('Error in registerForPushNotificationsAsync:', error);
        }
    }

    public async scheduleNotification(title: string, body: string, seconds: number) {
        try {
            const Notifications = require('expo-notifications');
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
            const Notifications = require('expo-notifications');
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
            console.error('Error scheduling scheduled notification:', error);
            return false;
        }
    }

    public async cancelAllNotifications() {
        try {
            const Notifications = require('expo-notifications');
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (error) {
            console.log("Error cancelling notifications:", error);
        }
    }
}

export const notificationService = NotificationService.getInstance();
