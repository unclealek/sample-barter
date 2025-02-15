import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch favorites for the logged-in user
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        console.log('No user session found');
        setLoading(false);
        return;
      }
      const userId = session?.session?.user.id;
      console.log('userId:', userId);

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          products (
            id,
            name,
            price,
            image_url,
            rating,
            description,
            profiles (
              full_name,
              email
            )
          )
        `)
        .eq('user_id',userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      }

      // Filter out any favorites where the product might have been deleted
      const validFavorites = data.filter(item => item.products !== null);
      setFavorites(validFavorites);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();

    // Set up real-time subscription for favorites
    const favoritesSubscription = supabase
      .channel('favorites_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'favorites' 
        }, 
        () => {
          fetchFavorites();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      favoritesSubscription.unsubscribe();
    };
  }, []);

  const handleProductPress = (product) => {
    router.push({
      pathname: '/product/[id]',
      params: { product: JSON.stringify(product) }
    });
  };

  const handleUnfavorite = async (favoriteId) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
      
      // Update the local state
      setFavorites(favorites.filter(item => item.id !== favoriteId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A4C77" />
        <Text>Loading favorites...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No favorite products yet!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => handleProductPress(item.products)}
          >
            <Image 
              source={{ uri: item.products.image_url }} 
              style={styles.image}
              defaultSource={require('../../assets/images/splash-icon.png')}
            />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>
                {item.products.name}
              </Text>
              <Text style={styles.price}>
                ${typeof item.products.price === 'number' 
                  ? item.products.price.toFixed(2) 
                  : item.products.price}
              </Text>
              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, index) => (
                  <Ionicons
                    key={index}
                    name={index < item.products.rating ? 'star' : 'star-outline'}
                    size={16}
                    color="#FFD700"
                  />
                ))}
              </View>
              {item.products.sellers && (
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>Seller: {item.products.sellers.name}</Text>
                  <Text style={styles.sellerContact}>Contact: {item.products.sellers.contact_info}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.unfavoriteButton} 
              onPress={() => handleUnfavorite(item.id)}
            >
              <Ionicons name="trash" size={20} color="#FF4D4D" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginVertical: 8,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  price: {
    color: '#5A4C77',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  unfavoriteButton: {
    padding: 8,
  },
});