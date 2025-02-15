import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

const ProductDetails = () => {
  const { product } = useLocalSearchParams();
  const item = JSON.parse(product);
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    checkIfFavorite();
    fetchSellerDetails();
  }, []);

  const fetchSellerDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', item.user_id)
        .single();

      if (error) throw error;
      setSeller(data);
    } catch (error) {
      console.error('Error fetching seller details:', error);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', session.session.user.id)
        .eq('product_id', item.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite:', error);
      } else {
        setIsFavorite(!!data);
        if (data) setFavoriteId(data.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoritePress = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        Alert.alert('Please log in to save favorites');
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', favoriteId);

        if (error) throw error;
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const { data, error } = await supabase
          .from('favorites')
          .insert([
            {
              user_id: session.session.user.id,
              product_id: item.id
            }
          ])
          .select('id')
          .single();

        if (error) throw error;
        setIsFavorite(true);
        setFavoriteId(data.id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Unable to update favorites');
    }
  };

  const handleChat = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        Alert.alert('Please log in to message the seller');
        return;
      }

      if (session.session.user.id === item.user_id) {
        Alert.alert('Note', 'This is your own product listing');
        return;
      }

      // Check for existing conversation
      const { data: existingConversation, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${session.session.user.id},user2_id.eq.${item.user_id}),and(user1_id.eq.${item.user_id},user2_id.eq.${session.session.user.id})`)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let conversationId;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const { data: newConversation, error: insertError } = await supabase
          .from('conversations')
          .insert({
            user1_id: session.session.user.id,
            user2_id: item.user_id
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        conversationId = newConversation.id;
      }

      // Navigate to chat screen
      router.push({
        pathname: `/chat/${conversationId}`,
      });

    } catch (error) {
      console.error('Error initiating chat:', error);
      Alert.alert('Error', 'Unable to start chat conversation');
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleFavoritePress} 
          style={styles.favoriteButton}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#FF4D4D" : "#333"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.productInfo}>
          <Text style={styles.title}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, index) => (
              <Ionicons
                key={index}
                name={index < item.rating ? "star" : "star-outline"}
                size={20}
                color="#FFD700"
              />
            ))}
            <Text style={styles.rating}>{item.rating}/5</Text>
          </View>
          <Text style={styles.price}>${item.price}</Text>
          <Text style={styles.description}>{item.description}</Text>

          {seller && (
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>Seller:</Text>
              <Text style={styles.sellerName}>{seller.full_name}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
        <LinearGradient
          colors={['#5A4C77', '#4c669f']}
          style={styles.gradient}
        >
          <Text style={styles.chatButtonText}>Message Seller</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  backButton: { padding: 8 },
  favoriteButton: { padding: 8 },
  image: {
    width: '100%',
    height: 300,
  },
  productInfo: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  rating: { marginLeft: 4, color: '#666' },
  price: { fontSize: 24, color: '#5A4C77', fontWeight: 'bold', marginBottom: 16 },
  description: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 16 },
  categoryContainer: { flexDirection: 'row', alignItems: 'center' },
  categoryLabel: { fontSize: 16, color: '#666', marginRight: 8 },
  categoryName: { fontSize: 16, color: '#5A4C77', fontWeight: '500' },
  chatButton: { padding: 16 },
  gradient: { borderRadius: 8, padding: 16 },
  chatButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  sellerLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  sellerName: {
    fontSize: 16,
    color: '#5A4C77',
    fontWeight: '500',
  },
});

export default ProductDetails;