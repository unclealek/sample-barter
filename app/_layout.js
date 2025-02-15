// app/_layout.js
import { Stack, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      // Check if user has seen onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        // Show onboarding if not seen yet
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        setIsFirstLaunch(true);
        router.replace('/onboarding');
        return;
      } else {
        setIsFirstLaunch(false);
      }

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // Redirect based on session and current route
      if (!session && !segments[0]?.includes('auth')) {
        router.replace('/(auth)/welcome');  // Redirect to welcome screen if no session
      } else if (session && !segments[0]?.includes('tabs')) {
        router.replace('/(tabs)/home');  // Redirect to home if session exists
      }
    };

    initializeApp();

    // Listen to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/home');
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [router]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> {/* Your tab layout */}
      <Stack.Screen name="product/[id]" options={{ headerShown: false }}  /> {/* Add ProductDetails here */}
      <Stack.Screen name="product/add-product" options={{ headerShown: false }}  /> {/* Add AddProduct here */}
      <Stack.Screen name="screens/profile" options={{ headerShown: false }}  /> {/* Add ProfileScreen here */}
      <Stack.Screen name="onboarding" options={{ headerShown: false }}  /> {/* Add OnboardingScreen here */}
    </Stack>
  );
}
