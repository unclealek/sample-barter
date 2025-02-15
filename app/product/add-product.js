import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';


export default function AddProduct() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: null, // Changed to null for single category selection
    rating: 0,
    image_url: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hardcoded categories - you can replace this with API call if needed
  const categories = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Clothing' },
    { id: 3, name: 'Home Appliances' },
  ];

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        alert('Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to pick image');
    }
  };

  const uploadImageToSupabase = async (imageBase64) => {
    try {
      if (!imageBase64) throw new Error('No image data');

      const fileName = `${Math.random()}.jpg`;
      const filePath = `products/${fileName}`;

      const arrayBuffer = decode(imageBase64);

      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleStarPress = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleCategorySelect = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId
    }));
  };
  
  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.name || !formData.price || !formData.category_id || !selectedImage || formData.rating === 0) {
        setError('Please fill in all required fields and add an image');
        return;
      }

      // Validate price format
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price');
        return;
      }

      const imageUrl = await uploadImageToSupabase(selectedImage.base64);
      const { data: { user } } = await supabase.auth.getUser();

      const { error: productError } = await supabase
        .from('products') // Changed to correct table name
        .insert({
          name: formData.name,
          description: formData.description,
          price: price,
          category_id: formData.category_id,
          user_id: user.id,
          image_url: imageUrl,
          rating: formData.rating,
        });

      if (productError) throw productError;

      // Clear form after successful submission
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: null,
        rating: 0,
        image_url: '',
      });
      setSelectedImage(null);
      Alert.alert('Success', 'Product added successfully!');
      router.replace('/(tabs)/home');// Adjust this based on your navigation structure
    } catch (error) {
      console.error('Error adding product:', error.message);
      setError('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

    <View style={styles.header}>
    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color="#333" />
    </TouchableOpacity>
    
  </View>
    <ScrollView style={styles.bodycontainer}>
    
      <TouchableOpacity style={styles.imageContainer} onPress={handleImagePick}>
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.clearImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-circle" size={24} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={40} color="#666" />
            <Text style={styles.imagePlaceholderText}>Add Product Image</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Product Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
        placeholder="Enter product name"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.description}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
        placeholder="Enter product description"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Price *</Text>
      <TextInput
        style={styles.input}
        value={formData.price}
        onChangeText={(text) => setFormData((prev) => ({ ...prev, price: text }))}
        placeholder="Enter price"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Category *</Text>
      <View style={styles.categoryContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              formData.category_id === category.id && styles.selectedCategoryButton
            ]}
            onPress={() => handleCategorySelect(category.id)}
          >
            <Text 
              style={[
                styles.categoryButtonText,
                formData.category_id === category.id && styles.selectedCategoryText
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Rating *</Text>
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
            <Ionicons
              name={star <= formData.rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= formData.rating ? '#FFD700' : '#666'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Add Product</Text>
        )}
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
    padding: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    margin: 5,
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  clearImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  starContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff4444',
    marginTop: 10,
    textAlign: 'center',
  },
});