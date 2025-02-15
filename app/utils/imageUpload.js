// utils/imageUpload.js
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { Platform } from 'react-native';
import uuid from 'react-native-uuid';

const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions to upload images!');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    return result.assets[0];
  }
};

const uploadImage = async (uri) => {
  try {
    const filename = `${uuid.v4()}.jpg`;
    const filePath = `${filename}`;

    // Convert image to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error.message);
    throw error;
  }
};

export default { pickImage, uploadImage };