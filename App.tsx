import 'react-native-get-random-values'; // Polyfill for Gemini must be first
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { logger } from './src/utils/Logger';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { notificationService } from './src/services/notifications/NotificationService';

// Log App Start
logger.info("Application Starting with Navigation...");

export default function App() {
  useEffect(() => {
    notificationService.registerForPushNotificationsAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1C1C1E" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
