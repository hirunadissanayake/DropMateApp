import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { socketService } from '../services/socketService';
import { useSupportStore } from '../store/supportStore';
import { useAuthStore } from '../store/authStore';
import BackButton from '../components/common/BackButton';

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const Icon = ({ name, size = 24, color = "#000", style, opacity = 1 }: any) => {
  if (name === 'chevron-back') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={[style, { opacity }]}>
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
  if (name === 'checkmark-done') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={[style, { opacity }]}>
      <Path d="M20 6L9 17l-5-5" />
      <Path d="M20 12l-11 11-5-5" />
    </Svg>
  );
  if (name === 'headset') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={[style, { opacity }]}>
      <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </Svg>
  );
  if (name === 'call-outline') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={[style, { opacity }]}>
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
  if (name === 'chatbubbles-outline') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={[style, { opacity }]}>
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
  if (name === 'add') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={[style, { opacity }]}>
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
  if (name === 'send') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={[style, { opacity }]}>
      <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </Svg>
  );
  return null;
};

const SupportChatScreen = () => {
  const navigation = useNavigation<any>();
  const { messages, setMessages } = useSupportStore();
  const { user } = useAuthStore();
  const [inputValue, setInputValue] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user?.id) {
      // Fetch history when entering chat
      socketService.getSupportHistory(user.id);
    }
  }, [user?.id]);

  const handleSend = () => {
    if (!inputValue.trim() || !user?.id) return;

    const messageData = {
      userId: user.id,
      message: inputValue,
      isAdmin: false,
      senderName: user.name,
    };

    socketService.sendSupportMessage(messageData);
    setInputValue('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = !item.isAdmin;
    
    return (
      <View style={[
        styles.messageWrapper,
        isMe ? styles.myMessageWrapper : styles.theirMessageWrapper
      ]}>
        <View style={[
          styles.messageBubble,
          isMe ? styles.myMessageBubble : styles.theirMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMe ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMe ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {formatTime(item.createdAt)}
            </Text>
            {isMe && <Icon name="checkmark-done" size={14} color="#FFF" style={{ marginLeft: 4 }} opacity={0.5} />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          color="#006C52"
        />
        
        <View style={styles.headerInfo}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#006C52', '#004A38']}
              style={styles.avatarGradient}
            >
              <Icon name="headset" size={20} color="#FFF" />
            </LinearGradient>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>DropMate Support</Text>
            <Text style={styles.headerStatus}>Always active</Text>
          </View>
        </View>

        {/* <TouchableOpacity style={styles.callButton}>
          <Icon name="call-outline" size={22} color="#006C52" />
        </TouchableOpacity> */}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="chatbubbles-outline" size={40} color="#006C52" opacity={0.3} />
              </View>
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySubtitle}>Our support team is here to help you. Send a message to get started.</Text>
            </View>
          )}
        />

        {/* Input */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={inputValue}
              onChangeText={setInputValue}
              multiline
            />

            <TouchableOpacity 
              style={[styles.sendButton, !inputValue.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputValue.trim()}
            >
              <LinearGradient
                colors={inputValue.trim() ? ['#006C52', '#004A38'] : ['#CCC', '#AAA']}
                style={styles.sendButtonGradient}
              >
                <Icon name="send" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Typography.bold,
    color: '#1A1A1A',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: Typography.bold,
  },
  callButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  messageList: {
    padding: 20,
    paddingBottom: 30,
  },
  messageWrapper: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: '#006C52',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  messageText: {
    fontSize: 15,
    fontFamily: Typography.medium,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFF',
  },
  theirMessageText: {
    color: '#1A1A1A',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: Typography.semiBold,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.6)',
  },
  theirMessageTime: {
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Typography.bold,
    color: '#1A1A1A',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Typography.medium,
  },
  inputWrapper: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    maxHeight: 100,
    fontSize: 15,
    fontFamily: Typography.semiBold,
    color: '#1A1A1A',
  },
  sendButton: {
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SupportChatScreen;
