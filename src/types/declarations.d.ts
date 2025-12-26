declare module '@expo/react-native-action-sheet' {
    import * as React from 'react';
    import { ViewStyle, TextStyle } from 'react-native';

    export interface ActionSheetProps {
        showActionSheetWithOptions: (
            options: ActionSheetOptions,
            callback: (buttonIndex: number) => void
        ) => void;
    }

    export interface ActionSheetOptions {
        options: string[];
        cancelButtonIndex?: number;
        destructiveButtonIndex?: number;
        title?: string;
        message?: string;
        anchor?: number;
        tintColor?: string;
        userInterfaceStyle?: 'light' | 'dark';
    }

    export const ActionSheetProvider: React.FC<{ children: React.ReactNode }>;
    export function useActionSheet(): ActionSheetProps;
    export function connectActionSheet<P>(
        WrappedComponent: React.ComponentType<P>
    ): React.ComponentType<P & ActionSheetProps>;
}

declare module '@env' {
    export const GEMINI_API_KEY: string;
    export const PERPLEXITY_API_KEY: string;
    export const FIREBASE_API_KEY: string;
    export const FIREBASE_AUTH_DOMAIN: string;
    export const FIREBASE_PROJECT_ID: string;
    export const FIREBASE_STORAGE_BUCKET: string;
    export const FIREBASE_MESSAGING_SENDER_ID: string;
    export const FIREBASE_APP_ID: string;
}
