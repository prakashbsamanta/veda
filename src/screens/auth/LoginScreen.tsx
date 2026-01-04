import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { authService } from '../../services/auth/AuthService';
import { theme } from '../../theme';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
    navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await authService.signIn(email, password);
            // Navigation handled by onAuthStateChanged in RootNavigator
        } catch (err: any) {
            console.error(err);
            let msg = 'Failed to login';
            if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password';
            if (err.code === 'auth/invalid-email') msg = 'Invalid email format';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue to Veda</Text>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor={theme.colors.text.muted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor={theme.colors.text.muted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.text.inverse} />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('Signup')}
                    >
                        <Text style={styles.linkText}>
                            Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.display,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.text.muted,
        marginBottom: 48, // Keeping this specific spacing
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        gap: theme.spacing.sm,
    },
    label: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.size.md,
        fontWeight: '500',
    },
    input: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.spacing.sm + 4, // 12
        padding: theme.spacing.md,
        color: theme.colors.text.secondary,
        fontSize: theme.typography.size.lg,
        borderWidth: 1,
        borderColor: theme.colors.background.tertiary,
    },
    button: {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.spacing.sm + 4, // 12
        padding: theme.spacing.md,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
    },
    errorText: {
        color: theme.colors.accent.error,
        fontSize: theme.typography.size.md,
        textAlign: 'center',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    linkText: {
        color: theme.colors.text.muted,
        fontSize: theme.typography.size.md,
    },
    linkHighlight: {
        color: theme.colors.text.primary,
        fontWeight: 'bold',
    },
});
