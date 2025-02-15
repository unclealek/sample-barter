import React, { useState, useEffect } from 'react';
import { RefreshControl, View, Text, StyleSheet, TextInput, FlatList, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRefresh } from '../../hooks/useRefresh';
import { supabase } from '../../lib/supabase';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter,useLocalSearchParams } from 'expo-router';

function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  

  const { refreshing, onRefresh } = useRefresh(fetchProducts);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          user_id,
          image_url,
          rating,
          created_at
          

        `)
        .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase Error:', error); // Log the full error
          throw error;
        }
    
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error.message);
      } finally {
        setLoading(false);
      }
    };

  const filterProducts = () => {
    let filtered = products;
    
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  };

  const handleProductPress = (product) => {
    router.push({
      pathname: '/product/[id]',
      params: { product: JSON.stringify(product) } 
    });
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.activeCategory
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.activeCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard} 
      onPress={() => handleProductPress(item)}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.productImage}
        defaultSource={require('../../assets/images/splash-icon.png')} // Add a placeholder image
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
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
        <Text style={styles.sellerName}>Added {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#5A4C77', "#4c669f", '#5A4C77']} 
        style={styles.gradientBackground}
      >
        <BlurView intensity={100} style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#fff" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#ccc"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </BlurView>

        <FlatList
          horizontal
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        />
      </LinearGradient>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery 
                ? "No products found matching your search" 
                : "No products available"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gradientBackground: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 35,
    paddingHorizontal: 15,
    marginBottom: 20
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    paddingVertical: 10
  },
  categoriesContainer: {
    marginBottom: 10
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)"
  },
  activeCategory: {
    backgroundColor: "rgba(255, 255, 255, 0.3)"
  },
  categoryText: {
    color: "#fff",
    fontSize: 14
  },
  activeCategoryText: {
    fontWeight: "bold"
  },
  productList: {
    padding: 10
  },
  productCard: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 8,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  productImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover"
  },
  productInfo: {
    padding: 10
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    height: 40
  },
  productPrice: {
    fontSize: 16,
    color: '#5A4C77',
    fontWeight: "bold"
  },
  ratingContainer: {
    flexDirection: 'row',
    marginVertical: 5
  },
  sellerName: {
    fontSize: 12,
    color: "#777",
    marginTop: 5
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 10
  }
});

export default HomeScreen;