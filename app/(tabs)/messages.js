import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('messages_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      const { data, error } = await supabase
  .from('conversations')
  .select(`
    *,
    user1: user1_id (
      id,
      full_name,
      avatar_url
    ),
    user2: user2_id (
      id,
      full_name,
      avatar_url
    )
  `)
  .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
  .order('created_at', { ascending: false });
console.log('Fetched Conversations:', data);
console.log('Error:', error);


  
      if (error) throw error;
  
      const processedConversations = data.map(conv => {
  const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1; // Change to conv.user1 and conv.user2
  const lastMessage = conv.last_message ? {
    content: conv.last_message,
    timestamp: conv.last_message_at,
    isFromMe: false // Adjust this logic based on your requirements
  } : null;

  return {
    id: conv.id,
    otherUser: {
      id: otherUser.id,
      fullName: otherUser.full_name,
      avatarUrl: otherUser.avatar_url
    },
    lastMessage: lastMessage,
    timestamp: lastMessage ? lastMessage.timestamp : conv.created_at
  };
});
  
      setConversations(processedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  const handleBack = () => {
    router.back();
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        {item.otherUser.avatarUrl ? (
          <Image
            source={{ uri: item.otherUser.avatarUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Text style={styles.avatarLetter}>
              {item.otherUser.fullName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.conversationInfo}>
        <View style={styles.topLine}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.otherUser.fullName || 'Unknown User'}
          </Text>
          <Text style={styles.timestamp}>
            {item.timestamp ? formatTimestamp(item.timestamp) : ''}
          </Text>
        </View>
        
        <View style={styles.bottomLine}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage ? (
              `${item.lastMessage.isFromMe ? 'You: ' : ''}${item.lastMessage.content}`
            ) : (
              'No messages yet'
            )}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A4C77" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <View style={styles.header}>
    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color="#333" />
    </TouchableOpacity>
    
  </View>
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No conversations yet</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderAvatar: {
    backgroundColor: '#5A4C77',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});