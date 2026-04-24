import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';
import * as notificationService from '../services/notificationService';
import { Notification } from '../services/notificationService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import BackButton from '../components/common/BackButton';

const BRAND_GREEN = '#00875A';
const BRAND_LIGHT = '#E6F5EF';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short' });
};

const getIconForType = (type: string) => {
  switch (type) {
    case 'PROFILE_APPROVED':
      return { icon: '✅', color: '#10B981', bgColor: '#ECFDF5' };
    case 'PROFILE_REJECTED':
      return { icon: '❌', color: '#EF4444', bgColor: '#FEF2F2' };
    case 'PARCEL_REQUEST':
      return { icon: '📦', color: '#3B82F6', bgColor: '#EFF6FF' };
    case 'PAYMENT_RECEIVED':
      return { icon: '💰', color: '#F59E0B', bgColor: '#FFFBEB' };
    default:
      return { icon: '🔔', color: '#64748B', bgColor: '#F1F5F9' };
  }
};

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await notificationService.getNotifications(token);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    try {
      await notificationService.markAsRead(token, id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await notificationService.markAllAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      Toast.show({ type: 'success', text1: 'All caught up!' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to mark all as read' });
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_GREEN} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(n => !n.isRead) ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_GREEN} />
        }
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : null}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </Svg>
            </View>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubText}>We'll notify you when something important happens</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {notifications.map((item) => {
              const { icon, color, bgColor } = getIconForType(item.type);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
                  onPress={() => handleMarkAsRead(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                    <Text style={{ fontSize: 20 }}>{icon}</Text>
                  </View>
                  
                  <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.itemTitle, !item.isRead && styles.unreadText]}>
                        {item.title}
                      </Text>
                      {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.itemBody} numberOfLines={2}>
                      {item.body}
                    </Text>
                    <Text style={styles.itemTime}>{formatDate(item.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.bold,
    color: '#0F172A',
  },
  markAllText: {
    fontSize: 12,
    color: BRAND_GREEN,
    fontFamily: Typography.bold,
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  unreadItem: {
    backgroundColor: '#F0FDF9', // Very subtle green for unread
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: Typography.medium,
    color: '#1E293B',
    flex: 1,
  },
  unreadText: {
    fontFamily: Typography.bold,
    color: '#0F172A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_GREEN,
    marginLeft: 8,
  },
  itemBody: {
    fontSize: 14,
    fontFamily: Typography.medium,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  itemTime: {
    fontSize: 12,
    fontFamily: Typography.medium,
    color: '#94A3B8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: Typography.bold,
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: Typography.medium,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationsScreen;
