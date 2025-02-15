
// components/SignUpTab.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';


const SignUpTab = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
  
    const handleSignUp = async () => {
      try {
        setLoading(true);
        setError('');
  
        const { user,error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
  
        if (signUpError) throw signUpError;
  
        // Add user profile data
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, full_name: fullName }]);
          if (profileError) {
            console.error('Profile insertion error:', profileError);
            throw profileError;
          }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <View style={styles.formContainer}>
      <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
        <Text style={styles.primaryButtonText}>Sign Up</Text>
      </TouchableOpacity>
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

  export  default SignUpTab;