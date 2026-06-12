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
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { socketService } from '../services/socketService';
import { useSupportStore } from '../store/supportStore';
import { useAuthStore } from '../store/authStore';
import BackButton from '../components/common/BackButton';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateHeader = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
};

const Icon = ({ name, size = 24, color = "#000", style, opacity = 1 }: any) => {
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
  if (name === 'chatbubbles-outline') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={[style, { opacity }]}>
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation<any>();
  const { messages, hasMore } = useSupportStore();
  const { user } = useAuthStore();
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user?.id) {
      setPage(1);
      socketService.getSupportHistory(user.id, 1);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoadingMore(false);
    if (messages.length > 0) {
      setInitialLoading(false);
    }
  }, [messages]);

  // If after 2 seconds messages are still empty, we stop initial loading to show empty state
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || !user?.id) return;
    setLoadingMore(true);
    socketService.getSupportHistory(user.id, page + 1);
    setPage(prev => prev + 1);
  };

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
    // Auto scroll to bottom after sending
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMe = !item.isAdmin;

    // Show date header if it's the first message or if the date has changed from the previous message
    const showDateHeader =
      index === 0 ||
      (messages[index - 1] &&
        new Date(item.createdAt).toDateString() !==
          new Date(messages[index - 1].createdAt).toDateString());

    return (
      <View key={item.id || index}>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <View style={styles.dateHeaderBubble}>
              <Text style={styles.dateHeaderText}>{formatDateHeader(item.createdAt)}</Text>
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageWrapper,
            isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMe ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
          >
            {!isMe && <Text style={styles.senderName}>{item.senderName || 'Support'}</Text>}
            <Text
              style={[
                styles.messageText,
                isMe ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.message}
            </Text>
          </View>
          <View style={[styles.messageFooter, isMe ? styles.myMessageFooter : styles.theirMessageFooter]}>
            <Text
              style={[
                styles.messageTime,
                isMe ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
            {isMe && (
              <Icon
                name="checkmark-done"
                size={12}
                color={theme.primary}
                style={{ marginLeft: 4 }}
                opacity={0.8}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
       <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <BackButton 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            color={theme.primary}
          />
          
          <View style={styles.headerInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
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
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {initialLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => (item.id || index).toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onScroll={(event) => {
              const { contentOffset } = event.nativeEvent;
              if (contentOffset.y <= 0 && !loadingMore && hasMore && messages.length > 0) {
                handleLoadMore();
              }
            }}
            onContentSizeChange={() => {
              if (page === 1) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            ListHeaderComponent={() => (
              loadingMore ? (
                <View style={{ paddingVertical: 10 }}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : null
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Icon name="chatbubbles-outline" size={40} color={theme.primary} opacity={0.4} />
                </View>
                <Text style={styles.emptyTitle}>Start a conversation</Text>
                <Text style={styles.emptySubtitle}>Our support team is here to help you. Send a message to get started.</Text>
              </View>
            )}
          />
        )}

        {/* Input area */}
        <SafeAreaView edges={['bottom']} style={styles.inputWrapperSafeArea}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { maxHeight: 100 }]}
                placeholder="Type a message..."
                placeholderTextColor={theme.text.placeholder}
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
                  colors={inputValue.trim() ? [theme.primary, theme.primaryDark] : [theme.border, theme.border]}
                  style={styles.sendButtonGradient}
                >
                  <Icon name="send" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerSafeArea: {
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    marginRight: 10,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: theme.card,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Typography.bold,
    color: theme.text.primary,
    letterSpacing: -0.3,
  },
  headerStatus: {
    fontSize: 13,
    color: '#10B981',
    fontFamily: Typography.semiBold,
    marginTop: -2,
  },
  messageList: {
    padding: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
  },
  messageWrapper: {
    marginBottom: 8,
    maxWidth: '82%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: theme.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: theme.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  senderName: {
    fontSize: 11,
    fontFamily: Typography.bold,
    color: theme.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 15.5,
    fontFamily: Typography.medium,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFF',
  },
  theirMessageText: {
    color: theme.text.primary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  myMessageFooter: {
    justifyContent: 'flex-end',
  },
  theirMessageFooter: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 10.5,
    fontFamily: Typography.medium,
  },
  myMessageTime: {
    color: theme.text.tertiary,
  },
  theirMessageTime: {
    color: theme.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    height: Dimensions.get('window').height * 0.6, // Ensure it fills enough space to center
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Typography.bold,
    color: theme.text.primary,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Typography.medium,
  },
  inputWrapperSafeArea: {
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: Typography.medium,
    color: theme.text.primary,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 12,
    marginBottom: 16,
  },
  dateHeaderBubble: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateHeaderText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: theme.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

export default SupportChatScreen;
