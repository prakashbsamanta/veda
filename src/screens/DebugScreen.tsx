import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useDBStore } from '../store/dbStore';
import { localAIService } from '../services/ai/LocalAIService';
import { cloudAIService } from '../services/ai/CloudAIService';
import { GEMINI_API_KEY, PERPLEXITY_API_KEY } from '@env';
import { LLMConfig } from '../config/llmConfig';

export default function DebugScreen() {
    const { initDatabase, isInitialized, error } = useDBStore();
    const [aiStatus, setAiStatus] = useState<string>('Initializing AI...');
    const [cloudResult, setCloudResult] = useState<string>('');
    const [loadingCloud, setLoadingCloud] = useState(false);
    const [activeTest, setActiveTest] = useState<string>(''); // 'gemini' | 'perplexity'

    useEffect(() => {
        initDatabase();
        localAIService.init()
            .then(() => setAiStatus('Local AI Ready 🤖'))
            .catch(err => setAiStatus(`AI Failed: ${err.message}`));
    }, []);

    const testCloudAI = async (provider: 'gemini' | 'perplexity') => {
        setLoadingCloud(true);
        setActiveTest(provider);
        setCloudResult(`Testing ${provider.toUpperCase()}...`);

        // Create temporary config for testing
        const testConfig: LLMConfig = {
            primary: {
                name: provider,
                apiKey: provider === 'gemini' ? (GEMINI_API_KEY || "") : (PERPLEXITY_API_KEY || ""),
                model: provider === 'gemini' ? 'gemini-2.0-flash' : 'sonar-pro',
                maxTokens: 500,
                enabled: true
            },
            apiKeyStorage: 'encrypted-local'
        };

        cloudAIService.setConfig(testConfig);

        try {
            const response = await cloudAIService.generateText("Hello from Veda! What model are you?");
            setCloudResult(`[${provider.toUpperCase()}] Response:\n${response.text}\n\nTokens Used: ${response.tokensUsed}`);
        } catch (err: any) {
            setCloudResult(`[${provider.toUpperCase()}] Error: ${err.message}`);
        } finally {
            setLoadingCloud(false);
        }
    };

    const testConnectivity = async () => {
        setCloudResult('Pinging google.com...');
        try {
            const res = await fetch('https://www.google.com', { method: 'HEAD' });
            setCloudResult(`Connectivity Check: ${res.status} ${res.ok ? 'OK' : 'Failed'}`);
        } catch (e: any) {
            setCloudResult(`Connectivity Failed: ${e.message}`);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Veda Debug</Text>
                <Text style={styles.subtitle}>System Status & Tools</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Database</Text>
                <View style={styles.statusRow}>
                    {error ? (
                        <Text style={styles.errorText}>DB Error: {error}</Text>
                    ) : isInitialized ? (
                        <Text style={styles.successText}>Database Initialized ✅</Text>
                    ) : (
                        <ActivityIndicator size="small" color="#E5D0AC" />
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Local AI</Text>
                <Text style={[styles.statusText, { color: '#E5D0AC' }]}>{aiStatus}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cloud AI Testing</Text>

                <TouchableOpacity
                    style={[styles.button, styles.geminiButton]}
                    onPress={() => testCloudAI('gemini')}
                    disabled={loadingCloud}
                >
                    <Text style={styles.buttonText}>
                        {loadingCloud && activeTest === 'gemini' ? 'Testing Gemini...' : 'Test Gemini (Google)'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.perplexityButton]}
                    onPress={() => testCloudAI('perplexity')}
                    disabled={loadingCloud}
                >
                    <Text style={styles.buttonText}>
                        {loadingCloud && activeTest === 'perplexity' ? 'Testing Perplexity...' : 'Test Perplexity (Sonar)'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.pingButton]} onPress={testConnectivity}>
                    <Text style={[styles.buttonText, { color: '#FFF' }]}>Test Internet (Ping)</Text>
                </TouchableOpacity>

                {cloudResult ? (
                    <View style={styles.resultBox}>
                        <Text style={styles.resultText}>{cloudResult}</Text>
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#1C1C1E',
        minHeight: '100%',
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#E5D0AC',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#A1A1AA',
    },
    section: {
        marginBottom: 25,
        padding: 15,
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    successText: {
        color: '#4CAF50',
        fontSize: 16,
    },
    errorText: {
        color: '#FF5252',
        fontSize: 16,
    },
    statusText: {
        fontSize: 16,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    geminiButton: {
        backgroundColor: '#E5D0AC',
    },
    perplexityButton: {
        backgroundColor: '#20B2AA', // Light Sea Green for Perplexity distinction
    },
    pingButton: {
        backgroundColor: '#555',
        marginTop: 5,
    },
    buttonText: {
        color: '#1C1C1E',
        fontSize: 15,
        fontWeight: 'bold',
    },
    resultBox: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        minHeight: 50,
    },
    resultText: {
        color: '#A1A1AA',
        fontSize: 14,
        fontFamily: 'monospace',
    }
});
