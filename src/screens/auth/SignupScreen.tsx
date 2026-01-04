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
    Alert,
    ScrollView
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { authService } from '../../services/auth/AuthService';
import { theme } from '../../theme';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

interface Props {
    navigation: SignupScreenNavigationProp;
}

export default function SignupScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await authService.signUp(email, password);
            // Verify if user profile update is needed for name, but for now basic auth is enough.
            // Navigation handled by RootNavigator listening to auth state
        } catch (err: any) {
            console.error(err);
            let msg = 'Failed to create account';
            if (err.code === 'auth/email-already-in-use') msg = 'Email already in use';
            if (err.code === 'auth/invalid-email') msg = 'Invalid email format';
            if (err.code === 'auth/weak-password') msg = 'Password is too weak';
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
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join Veda to start your journey</Text>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            placeholderTextColor={theme.colors.text.muted}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>

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
                            placeholder="Create a password"
                            placeholderTextColor={theme.colors.text.muted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm your password"
                            placeholderTextColor={theme.colors.text.muted}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.text.inverse} />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.linkText}>
                            Already have an account? <Text style={styles.linkHighlight}>Log In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    content: {
        flexGrow: 1,
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
        marginBottom: 48, // Keeping logical spacing
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
        borderRadius: theme.spacing.sm + 4,
        padding: theme.spacing.md,
        color: theme.colors.text.secondary,
        fontSize: theme.typography.size.lg,
        borderWidth: 1,
        borderColor: theme.colors.background.tertiary,
    },
    button: {
        backgroundColor: theme.colors.accent.primary,
        borderRadius: theme.spacing.sm + 4,
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
