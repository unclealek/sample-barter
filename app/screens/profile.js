// app/profile.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { pickImage, uploadImage } from '../utils/imageUpload';
import { useLoadingState } from '../../hooks/useLoadingState';
import { LoadingState } from '../../components/LoadingState';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
  });
  const [userProducts, setUserProducts] = useState([]);
  const { loading, error, withLoading } = useLoadingState();

  useEffect(() => {
    fetchProfile();
    fetchUserProducts();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
  
      if (error) throw error;
  
      // Fetch uploaded products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
  
      if (productsError) throw productsError;
  
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        avatar_url: data.avatar_url || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Could not load profile data.');
    }
  }; 

  const fetchUserProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Could not load your products');
    }
  };

  const handleImagePick = async () => {
    try {
      const image = await pickImage();
      if (image) {
        const imageUrl = await uploadImage(image.uri);
        setFormData(prev => ({ ...prev, avatar_url: imageUrl }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };
const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

              if (error) throw error;

              setUserProducts(prevProducts => 
                prevProducts.filter(product => product.id !== productId)
              );
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };
  

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }
  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
        {item.rating && (
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, index) => (
              <Ionicons
                key={index}
                name={index < item.rating ? "star" : "star-outline"}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
        )}
      </View>

    <View style={styles.productActions}>
    <TouchableOpacity 
        onPress={() => {
          if (item.id) {
            router.push({
              pathname: 'product/editProduct',
              params: { id: item.id.toString() }
            });
          } else {
            Alert.alert('Error', 'Invalid product ID');
          }
        }}
        style={styles.editButton}
      >
        <Ionicons name="create-outline" size={24} color="#4CAF50" />
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => handleDeleteProduct(item.id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={24} color="#E63946" />
      </TouchableOpacity>
    </View>
    </View>
  );
  
  const handleSave = async () => {
    await withLoading(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', user.id);

        if (error) throw error;

        setProfile({ ...profile, ...formData });
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to save changes');
      }
    });
  };

 
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.bodycontainer}>
        <View style={styles.avatarheader}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={isEditing ? handleImagePick : undefined}
          >
            {formData.avatar_url ? (
              <Image
                source={{ uri: formData.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
            {isEditing && (
              <View style={styles.editOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={formData.full_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
              placeholder="Your name"
            />
          ) : (
            <Text style={styles.name}>{profile?.full_name}</Text>
          )}
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>My Products</Text>
          {userProducts.length === 0 ? (
            <Text style={styles.noProducts}>You haven't posted any products yet</Text>
          ) : (
            <FlatList
              data={userProducts}
              renderItem={renderProductItem}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
        >
          <Text style={styles.saveButtonText}>{isEditing ? 'Save' : 'Edit Profile'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  bodycontainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  avatarheader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginTop: 8,
    padding: 4,
    width: '80%',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
  },
  editButtonText: {
  color: 'blue',
  fontWeight: 'bold',
},
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
  },uploadedItemsContainer: {
  marginTop: 20,
},
ratingContainer: {
    flexDirection: 'row',
    marginVertical: 5
  },
productsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  noProducts: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
itemContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 8,
},
deleteButtonText: {
  color: 'red',
  fontWeight: 'bold',
},
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#E63946',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
