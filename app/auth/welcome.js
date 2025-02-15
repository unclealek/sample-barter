// app/screens/WelcomeScreen.js
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginTab from './LoginTab';
import SignUpTab from './SignUpTab';
import { useRouter } from 'expo-router';

const WelcomeScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');
  

  return (
    <View style={styles.container}>
    <Text style={styles.title}>Barter</Text>
    <Text style={styles.subtitle}>Just exchange it</Text>
    <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Login' && styles.activeTab]} onPress={() => setActiveTab('Login')}>
          <Text style={[styles.tabText, activeTab === 'Login' && styles.activeTabText]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'SignUp' && styles.activeTab]} onPress={() => setActiveTab('SignUp')}>
          <Text style={[styles.tabText, activeTab === 'SignUp' && styles.activeTabText]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'Login' ? <LoginTab /> : <SignUpTab />}
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#5A4C77',
    textShadowColor: '#AAA',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: '#5A4C77',
  },
  tabText: {
    fontSize: 18,
    color: '#666',
  },
  activeTabText: {
    color: '#5A4C77',
    fontWeight: 'bold',
  },
  formContainer: {
    width: '85%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#5A4C77',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
});

export default WelcomeScreen;