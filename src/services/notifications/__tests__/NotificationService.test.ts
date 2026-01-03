import { NotificationService } from '../NotificationService';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Augment global for mock state
declare global {
    var mockIsDevice: boolean;
}

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    cancelAllScheduledNotificationsAsync: jest.fn(),
    AndroidImportance: {
        MAX: 'max',
    },
    SchedulableTriggerInputTypes: {
        TIME_INTERVAL: 'timeInterval',
        DATE: 'date'
    }
}));

// Mock expo-device using global state
jest.mock('expo-device', () => ({
    get isDevice() { return global.mockIsDevice; }
}));

describe('NotificationService', () => {
    let service: NotificationService;

    beforeEach(() => {
        // Reset singleton
        (NotificationService as any).instance = undefined;
        jest.clearAllMocks();

        // Reset device mock
        global.mockIsDevice = true;

        // Reset Platform to default (ios)
        Object.defineProperty(Platform, 'OS', { get: () => 'ios', configurable: true });

        // Default permission mocks
        (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    });

    it('should initialize and setup handler', () => {
        service = NotificationService.getInstance();
        expect(Notifications.setNotificationHandler).toHaveBeenCalled();
        const handler = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0].handleNotification;
        expect(handler()).resolves.toEqual(expect.objectContaining({
            shouldShowAlert: true,
            shouldPlaySound: true
        }));
    });

    it('should configure android channel on android', async () => {
        // Mock Platform.OS to android
        Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });

        service = NotificationService.getInstance();
        await service.registerForPushNotificationsAsync();

        expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', expect.any(Object));
    });

    it('should request permissions if not determined', async () => {
        (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
        (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

        service = NotificationService.getInstance();
        await service.registerForPushNotificationsAsync();

        expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should not request permissions if already granted', async () => {
        (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

        service = NotificationService.getInstance();
        await service.registerForPushNotificationsAsync();

        expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
        const spy = jest.spyOn(console, 'log').mockImplementation();
        (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
        (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

        service = NotificationService.getInstance();
        await service.registerForPushNotificationsAsync();

        expect(spy).toHaveBeenCalledWith('Permission not granted for notifications');
        spy.mockRestore();
    });

    it('should handle error requesting permissions', async () => {
        const spy = jest.spyOn(console, 'log').mockImplementation();
        (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Perm Error'));

        service = NotificationService.getInstance();
        await service.registerForPushNotificationsAsync();

        expect(spy).toHaveBeenCalledWith('Error in registerForPushNotificationsAsync:', expect.any(Error));
        spy.mockRestore();
    });

    it('should handle non-device (simulator)', async () => {
        global.mockIsDevice = false;

        const spy = jest.spyOn(console, 'log').mockImplementation();

        service = NotificationService.getInstance();
        await service.registerForPushNotificationsAsync();

        expect(spy).toHaveBeenCalledWith('Must use physical device for Notifications');
        spy.mockRestore();
    });

    it('should schedule notification', async () => {
        service = NotificationService.getInstance();
        await service.scheduleNotification('Title', 'Body', 5);

        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.objectContaining({ title: 'Title', body: 'Body' }),
            trigger: expect.objectContaining({ seconds: 2 }) // as per code implementation
        }));
    });

    it('should schedule notification at date', async () => {
        service = NotificationService.getInstance();
        const date = new Date();
        await service.scheduleNotificationAtDate('Title', 'Body', date);

        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
            trigger: expect.objectContaining({ date: date })
        }));
    });

    it('should cancel all notifications', async () => {
        service = NotificationService.getInstance();
        await service.cancelAllNotifications();
        expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('should handle scheduling error', async () => {
        (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(new Error('Schedule Error'));
        service = NotificationService.getInstance();

        const result = await service.scheduleNotification('T', 'B', 1);
        expect(result).toBe(false);
    });

    it('should handle scheduling at date error', async () => {
        (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(new Error('Schedule Error'));
        service = NotificationService.getInstance();

        const result = await service.scheduleNotificationAtDate('T', 'B', new Date());
        expect(result).toBe(false);
    });
    it('should skip setup in Expo Go on Android', () => {
        Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
        Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });

        // Reset instance to trigger constructor again (which calls setupNotificationHandler)
        (NotificationService as any).instance = undefined;
        service = NotificationService.getInstance();

        expect(Notifications.setNotificationHandler).not.toHaveBeenCalled();

        // Reset Constants
        Constants.executionEnvironment = ExecutionEnvironment.Standalone; // or generic string
    });

    it('should skip registration in Expo Go on Android', async () => {
        Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
        Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });

        const spy = jest.spyOn(console, 'log').mockImplementation();
        service = NotificationService.getInstance();
        await service.registerForPushNotificationsAsync();

        expect(spy).toHaveBeenCalledWith(expect.stringContaining('Expo Go detected'));
        expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();

        spy.mockRestore();
        Constants.executionEnvironment = ExecutionEnvironment.Standalone;
    });

    it('should handle setNotificationHandler error', () => {
        // Trigger error by mocking the set handler to throw
        (Notifications.setNotificationHandler as jest.Mock).mockImplementation(() => { throw new Error('Handler fail'); });

        const spy = jest.spyOn(console, 'log').mockImplementation();

        // Reset instance to call constructor
        (NotificationService as any).instance = undefined;
        new (NotificationService as any)();

        expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to set notification handler'), expect.any(Error));
        spy.mockRestore();
    });

    it('should handle cancelAllNotifications error', async () => {
        (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(new Error('Cancel fail'));
        const spy = jest.spyOn(console, 'log').mockImplementation();

        service = NotificationService.getInstance();
        await service.cancelAllNotifications();

        expect(spy).toHaveBeenCalledWith('Error cancelling notifications:', expect.any(Error));
        spy.mockRestore();
    });
});
