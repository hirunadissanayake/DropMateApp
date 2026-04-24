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
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
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
import CustomAlert from '../components/common/CustomAlert';
import LinearGradient from 'react-native-linear-gradient';

const BRAND_GREEN = '#00875A';
const BRAND_DARK = '#004D3A';
const BRAND_LIGHT = '#E6F5EF';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short' });
};

const groupNotifications = (notifications: Notification[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const groups: { [key: string]: Notification[] } = {
    'Today': [],
    'Yesterday': [],
    'Earlier': []
  };

  notifications.forEach(n => {
    const nDate = new Date(n.createdAt);
    nDate.setHours(0, 0, 0, 0);

    if (nDate.getTime() === today.getTime()) {
      groups['Today'].push(n);
    } else if (nDate.getTime() === yesterday.getTime()) {
      groups['Yesterday'].push(n);
    } else {
      groups['Earlier'].push(n);
    }
  });

  return Object.entries(groups).filter(([_, items]) => items.length > 0);
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
  const [alertVisible, setAlertVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = (id: string) => {
    setSelectedId(id);
    setAlertVisible(true);
  };

  const confirmDelete = async () => {
    if (!token || !selectedId) return;
    setDeleting(true);
    try {
      await notificationService.deleteNotification(token, selectedId);
      setNotifications(prev => prev.filter(n => n.id !== selectedId));
      Toast.show({ type: 'success', text1: 'Notification deleted' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to delete notification' });
    } finally {
      setDeleting(false);
      setAlertVisible(false);
      setSelectedId(null);
    }
  };

  const renderRightActions = (id: string) => {
    return (
      <View style={{ width: 90, height: '100%', paddingVertical: 6 }}>
        <TouchableOpacity 
            style={styles.deleteSwipeAction} 
            onPress={() => handleDelete(id)}
        >
            <View style={styles.deleteIconContainer}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                    <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                </Svg>
            </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={[BRAND_GREEN, BRAND_DARK]} style={styles.heroSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <BackButton color="#FFFFFF" onPress={() => navigation.goBack()} />
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_GREEN} />
        }
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : styles.scrollContent}
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
            {groupNotifications(notifications).map(([groupName, items], index) => (
              <View key={groupName} style={styles.groupSection}>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.groupHeader}>{groupName}</Text>
                  {index === 0 && notifications.some(n => !n.isRead) && (
                    <TouchableOpacity onPress={handleMarkAllRead}>
                      <Text style={styles.groupMarkAllText}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {items.map((item) => {
                  const { icon, color, bgColor } = getIconForType(item.type);
                  return (
                    <Swipeable
                      key={item.id}
                      renderRightActions={() => renderRightActions(item.id)}
                      friction={2}
                      rightThreshold={40}
                    >
                      <TouchableOpacity
                        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
                        onPress={() => handleMarkAsRead(item.id)}
                        activeOpacity={0.9}
                      >
                        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
                          <Text style={{ fontSize: 22 }}>{icon}</Text>
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
                          <View style={styles.footerRow}>
                            <Text style={styles.itemTime}>{formatDate(item.createdAt)}</Text>
                            {item.isRead ? null : <Text style={styles.newBadge}>New</Text>}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Swipeable>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        type="warning"
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setAlertVisible(false)}
      />
    </View>
  );
};
  

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  heroSection: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Typography.bold,
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingBottom: 32,
  },
  listContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  groupSection: {
    marginBottom: 24,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 4,
  },
  groupHeader: {
    fontSize: 14,
    fontFamily: Typography.bold,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.1,
    marginLeft: 4,
  },
  groupMarkAllText: {
    fontSize: 13,
    color: BRAND_GREEN,
    fontFamily: Typography.bold,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#00875A30',
    borderLeftWidth: 4,
    borderLeftColor: BRAND_GREEN,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
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
    fontFamily: Typography.bold,
    color: '#1E293B',
    flex: 1,
  },
  unreadText: {
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
    fontSize: 13,
    fontFamily: Typography.medium,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTime: {
    fontSize: 11,
    fontFamily: Typography.medium,
    color: '#94A3B8',
  },
  newBadge: {
    backgroundColor: BRAND_LIGHT,
    color: BRAND_GREEN,
    fontSize: 10,
    fontFamily: Typography.bold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  deleteSwipeAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 24,
    marginLeft: 10,
  },
  deleteIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#006C52',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  emptyText: {
    fontSize: 22,
    fontFamily: Typography.bold,
    color: '#1E293B',
    marginBottom: 12,
  },
  emptySubText: {
    fontSize: 15,
    fontFamily: Typography.medium,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default NotificationsScreen;
