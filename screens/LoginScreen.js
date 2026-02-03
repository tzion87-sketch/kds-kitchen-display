import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  I18nManager,
} from 'react-native';

I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🍽️</Text>
        </View>
        <Text style={styles.title}>מערכת תצוגת מטבח</Text>
        <Text style={styles.subtitle}>KDS - Kitchen Display System</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.kitchenButton]}
          onPress={() => navigation.navigate('Kitchen')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>👨‍🍳</Text>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonText}>תצוגת מטבח</Text>
            <Text style={styles.buttonSubtext}>צפייה והכנת הזמנות</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.adminButton]}
          onPress={() => navigation.navigate('Admin')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>⚙️</Text>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonText}>פאנל ניהול</Text>
            <Text style={styles.buttonSubtext}>הגדרות ותצורה</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Nayax</Text>
        <Text style={styles.versionText}>v1.0.1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoIcon: {
    fontSize: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  buttonsContainer: {
    padding: 30,
    gap: 20,
  },
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 20,
  },
  kitchenButton: {
    backgroundColor: '#388E3C',
  },
  adminButton: {
    backgroundColor: '#1976D2',
  },
  buttonIcon: {
    fontSize: 40,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
    gap: 8,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});
