import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Favorites',
      icon: 'heart',
      onPress: () => router.push('/screens/FavScreen'),
    },
    {
      title: 'Add Product',
      icon: 'add-circle',
      onPress: () => router.push('/product/add-product'),
    },
    {
      title: 'Support',
      icon: 'help-circle',
      onPress: () => router.push('https://anthropomass.org/reshaping/'),
    },
    {
      title: 'Invite a Friend',
      icon: 'person-add',
      onPress: () => router.push('https://anthropomass.org/reshaping/'),
    },
    {
      title: 'Sign Out',
      icon: 'log-out',
      onPress: async () => {
        await supabase.auth.signOut();
        await clearLocalStorage(); 
        router.replace('/onboarding');
      },
    },
  ];

  const renderMenuItem = ({ title, icon, onPress }) => (
    <TouchableOpacity key={title} style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        <Ionicons name={icon} size={24} color="#4A90E2" />
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#C4C4C4" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.profileSection}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/screens/profile')}
        >
          <Ionicons name="person-circle" size={50} color="#4A90E2" />
          <Text style={styles.profileText}>View Profile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.menu}>
        {menuItems.map(renderMenuItem)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileButton: {
    alignItems: 'center',
  },
  profileText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2',
  },
  menu: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#333',
    fontWeight: '500',
  },
});