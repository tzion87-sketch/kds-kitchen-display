import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Clipboard,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminScreen({ navigation }) {
  const [deviceId, setDeviceId] = useState('');
  const [token, setToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeDevice();
  }, []);

  const initializeDevice = async () => {
    try {
      setLoading(true);

      let storedDeviceId = await AsyncStorage.getItem('deviceId');
      if (!storedDeviceId) {
        storedDeviceId = uuid.v4();
        await AsyncStorage.setItem('deviceId', storedDeviceId);
      }
      setDeviceId(storedDeviceId);

      let storedToken = await AsyncStorage.getItem('deviceToken');
      if (!storedToken) {
        storedToken = uuid.v4();
        await AsyncStorage.setItem('deviceToken', storedToken);
      }
      setToken(storedToken);

      const url = `https://vdrrqglgvpqskwjopsmr.supabase.co/functions/v1/webhook-kds`;
      setWebhookUrl(url);

    } catch (error) {
      console.error('Error initializing device:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לאתחל את המכשיר');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('✅ הועתק!', `${label} הועתק ללוח`);
  };

  const regenerateToken = () => {
    Alert.alert(
      '🔄 יצירת Token חדש',
      'האם אתה בטוח? תצטרך לעדכן את ה-Token במערכת Retail Core',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'אישור',
          style: 'destructive',
          onPress: async () => {
            const newToken = uuid.v4();
            await AsyncStorage.setItem('deviceToken', newToken);
            setToken(newToken);
            Alert.alert('✅ הצלחה', 'Token חדש נוצר בהצלחה');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>טוען...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>חזור</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ פאנל ניהול</Text>
        <Text style={styles.headerSubtitle}>הגדרות חיבור למערכת</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔗</Text>
            <Text style={styles.cardTitle}>Webhook URL</Text>
          </View>
          <Text style={styles.instruction}>
            הזן כתובת זו במערכת Retail Core בהגדרות Webhooks
          </Text>
          <View style={styles.valueBox}>
            <Text style={styles.valueText} selectable>
              {webhookUrl}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => copyToClipboard(webhookUrl, 'Webhook URL')}
          >
            <Text style={styles.buttonIcon}>📋</Text>
            <Text style={styles.buttonText}>העתק URL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔐</Text>
            <Text style={styles.cardTitle}>Authorization Token</Text>
          </View>
          <Text style={styles.instruction}>
            שלח את ה-Token בכותרת Authorization במערכת Retail Core
          </Text>
          <View style={styles.valueBox}>
            <Text style={styles.valueText} selectable numberOfLines={2}>
              {token}
            </Text>
          </View>
          <View style={styles.tokenButtons}>
            <TouchableOpacity
              style={[styles.halfButton, styles.copyButton, { marginLeft: 8 }]}
              onPress={() => copyToClipboard(token, 'Token')}
            >
              <Text style={styles.buttonIcon}>📋</Text>
              <Text style={styles.buttonText}>העתק</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.halfButton, styles.regenerateButton]}
              onPress={regenerateToken}
            >
              <Text style={styles.buttonIcon}>🔄</Text>
              <Text style={styles.buttonText}>יצור חדש</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, styles.instructionsCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📖</Text>
            <Text style={styles.cardTitle}>הוראות הגדרה</Text>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                במערכת Retail Core, לך להגדרות Webhooks
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                העתק את ה-Webhook URL והדבק בשדה URL
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                העתק את ה-Token והדבק בשדה Authorization
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>
                שמור והזמנות יתחילו להגיע אוטומטית! 🎉
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.exampleCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💻</Text>
            <Text style={styles.cardTitle}>דוגמת שליחה</Text>
          </View>
          <View style={styles.codeBox}>
            <Text style={styles.codeText} selectable>
{`POST ${webhookUrl}
Authorization: Bearer ${token}
Content-Type: application/json

{
  "orderNumber": 12345,
  "transactionKey": "...",
  "storeCode": "STORE001",
  "posCode": "POS001",
  "items": [...],
  "totalAmount": 150.50
}`}
            </Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 28,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  instruction: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  valueBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  valueText: {
    fontSize: 13,
    color: '#495057',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenButtons: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  halfButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#4CAF50',
  },
  regenerateButton: {
    backgroundColor: '#FF9800',
  },
  instructionsCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  stepContainer: {
    marginTop: 8,
  },
  step: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#1565C0',
    lineHeight: 22,
  },
  exampleCard: {
    backgroundColor: '#263238',
  },
  codeBox: {
    backgroundColor: '#1e272e',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  codeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
