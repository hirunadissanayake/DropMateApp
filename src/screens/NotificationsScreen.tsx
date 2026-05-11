import React, { useState, useCallback, useMemo } from 'react';
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
  Pressable,
  FlatList,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as notificationService from '../services/notificationService';
import { Notification } from '../services/notificationService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import BackButton from '../components/common/BackButton';
import CustomAlert from '../components/common/CustomAlert';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';
import { useNotificationStore } from '../store/notificationStore';

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

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'PROFILE_APPROVED':
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 6L9 17l-5-5" />
        </Svg>
      );
    case 'PROFILE_REJECTED':
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 6L6 18M6 6l12 12" />
        </Svg>
      );
    case 'PARCEL_REQUEST':
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
          <Path d="M12 22.08V12" />
        </Svg>
      );
    case 'PAYMENT_RECEIVED':
      return (
        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="2" y="6" width="20" height="12" rx="2" />
          <Circle cx="12" cy="12" r="3" />
          <Path d="M6 12h.01M18 12h.01" />
        </Svg>
      );
    default:
      return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3DD9A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </Svg>
      );
  }
};

const getIconBgColor = (type: string, theme: AppTheme) => {
  if (theme.isDark) {
    switch (type) {
      case 'PROFILE_APPROVED': return 'rgba(16, 185, 129, 0.1)';
      case 'PROFILE_REJECTED': return 'rgba(239, 68, 68, 0.1)';
      case 'PARCEL_REQUEST': return 'rgba(59, 130, 246, 0.1)';
      case 'PAYMENT_RECEIVED': return 'rgba(245, 158, 11, 0.1)';
      default: return 'rgba(61, 217, 164, 0.1)';
    }
  }
  switch (type) {
    case 'PROFILE_APPROVED': return '#ECFDF5';
    case 'PROFILE_REJECTED': return '#FEF2F2';
    case 'PARCEL_REQUEST': return '#EFF6FF';
    case 'PAYMENT_RECEIVED': return '#FFFBEB';
    default: return '#E6F5EF';
  }
};

// ─── Memoized Notification Row ──────────────────────────────────────────────
type NotificationRowProps = {
  item: any;
  isSelectionMode: boolean;
  isSelected: boolean;
  styles: any;
  theme: AppTheme;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
  onDelete: (id: string) => void;
};

const NotificationRow = React.memo(({ item, isSelectionMode, isSelected, styles, theme, onPress, onLongPress, onDelete }: NotificationRowProps) => {
  const bgColor = getIconBgColor(item.type, theme);
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Swipeable
        renderRightActions={() => (
          <View style={{ width: 100, height: '100%' }}>
            <TouchableOpacity style={styles.deleteSwipeAction} onPress={() => onDelete(item.id)}>
              <View style={styles.deleteIconContainer}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                  <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                </Svg>
              </View>
            </TouchableOpacity>
          </View>
        )}
        friction={2}
        rightThreshold={40}
        enabled={!isSelectionMode}
      >
        <Pressable
          onPress={() => onPress(item.id)}
          onLongPress={() => onLongPress(item.id)}
          delayLongPress={200}
          style={({ pressed }) => [
            styles.notificationCard,
            !item.isRead && styles.unreadCard,
            isSelected && styles.selectedCard,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <NotificationIcon type={item.type} />
          </View>
          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.itemTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
              {!item.isRead && !isSelectionMode && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.itemBody}>{item.body}</Text>
            <View style={styles.footerRow}>
              <Text style={styles.itemTime}>{formatDate(item.createdAt)}</Text>
              {item.isRead ? null : <Text style={styles.newBadge}>New</Text>}
            </View>
          </View>
          {isSelectionMode && (
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                {isSelected && (
                  <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4">
                    <Path d="M20 6L9 17l-5-5" />
                  </Svg>
                )}
              </View>
            </View>
          )}
        </Pressable>
      </Swipeable>
    </View>
  );
});

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuthStore();
  const { setUnreadCount } = useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkAlertVisible, setBulkAlertVisible] = useState(false);
  const isProcessingRef = React.useRef(false);

  // Flatten notifications for FlatList with headers
  const flattenedData = useMemo(() => {
    const groups = groupNotifications(notifications);
    const flattened: any[] = [];
    groups.forEach(([title, items], index) => {
        flattened.push({ viewType: 'header', title, isFirst: index === 0 });
        items.forEach(item => {
            flattened.push({ viewType: 'item', ...item });
        });
    });
    return flattened;
  }, [notifications]);

  const fetchNotifications = async (pageNum = 1) => {
    if (!token) return;
    try {
      const data = await notificationService.getNotifications(token, pageNum);
      if (pageNum === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      fetchNotifications(1);
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchNotifications(1);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchNotifications(nextPage);
  };

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    try {
      await notificationService.markAsRead(token, id);
      
      setNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
        const unreadCount = updated.filter(n => !n.isRead).length;
        setUnreadCount(unreadCount);
        return updated;
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await notificationService.markAllAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
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

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setBulkAlertVisible(true);
  };

  const confirmBulkDelete = async () => {
    if (!token || selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => notificationService.deleteNotification(token, id)));
      
      const updated = notifications.filter(n => !selectedIds.includes(n.id));
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.isRead).length);
      
      Toast.show({ type: 'success', text1: `${selectedIds.length} notifications deleted` });
      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to delete some notifications' });
    } finally {
      setIsBulkDeleting(false);
      setBulkAlertVisible(false);
    }
  };

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      if (next.length === 0) setIsSelectionMode(false);
      return next;
    });
  }, []);

  const handlePressItem = useCallback(async (id: string) => {
    if (isProcessingRef.current) return;
    
    if (isSelectionMode) {
      toggleSelection(id);
      return;
    }

    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    if (notification.isRead) return;

    isProcessingRef.current = true;
    try {
      await handleMarkAsRead(id);
    } catch (error) {
      console.error('Handle notification press error:', error);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  }, [isSelectionMode, toggleSelection, notifications, handleMarkAsRead]);

  const handleLongPressItem = useCallback((id: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds([id]);
    }
  }, [isSelectionMode]);

  const handleDeleteItem = useCallback((id: string) => {
    setSelectedId(id);
    setAlertVisible(true);
  }, []);

  const handleSelectAll = (items: Notification[]) => {
    const allIds = items.map(i => i.id);
    const areAllSelected = allIds.every(id => selectedIds.includes(id));
    
    if (areAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
    }
  };

  const renderRightActions = useCallback((id: string) => {
    return (
      <View style={{ width: 100, height: '100%' }}>
        <TouchableOpacity 
            style={styles.deleteSwipeAction} 
            onPress={() => handleDeleteItem(id)}
        >
            <View style={styles.deleteIconContainer}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                    <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                </Svg>
            </View>
        </TouchableOpacity>
      </View>
    );
  }, [handleDeleteItem, styles]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          <SafeAreaView edges={['top']} style={styles.stickyHeader}>
            <View style={styles.headerActionRow}>
              <View style={styles.headerLeft}>
                <BackButton onPress={() => {
                    if (isSelectionMode) {
                        setIsSelectionMode(false);
                        setSelectedIds([]);
                    } else {
                        navigation.goBack();
                    }
                }} />
              </View>
              
              <View style={styles.headerTitleContainer}>
                {isSelectionMode ? (
                    <Text style={styles.headerTitleCenter}>{selectedIds.length} Selected</Text>
                ) : (
                    <Text style={styles.headerTitleCenter}>Notifications</Text>
                )}
              </View>

              <View style={styles.headerRight}>
                 {isSelectionMode ? (
                    <TouchableOpacity 
                        onPress={handleBulkDelete}
                        disabled={selectedIds.length === 0 || isBulkDeleting}
                        style={styles.headerDeleteBtn}
                    >
                        {isBulkDeleting ? (
                            <ActivityIndicator color="#EF4444" size="small" />
                        ) : (
                            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                                <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                            </Svg>
                        )}
                    </TouchableOpacity>
                 ) : null}
              </View>
            </View>
          </SafeAreaView>

          <FlatList
            data={flattenedData}
            keyExtractor={(item, index) => item.viewType === 'header' ? `header-${item.title}` : item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={notifications.length === 0 ? { flex: 1, justifyContent: 'center' } : styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
            ListHeaderComponent={
              <LinearGradient 
                colors={theme.isDark ? ['rgba(61, 217, 164, 0.05)', 'rgba(61, 217, 164, 0.02)', theme.background] : ['#E6F5EF', '#F0FDF4', theme.background]} 
                style={styles.backgroundGradient} 
              />
            }
            renderItem={({ item }) => {
              if (item.viewType === 'header') {
                return (
                  <View style={[styles.groupHeaderRow, !item.isFirst && { marginTop: 20 }, { paddingHorizontal: 20 }]}>
                    <Text style={styles.groupHeader}>{item.title}</Text>
                    {item.isFirst && notifications.some(n => !n.isRead) && (
                      <TouchableOpacity onPress={handleMarkAllRead}>
                        <Text style={styles.groupMarkAllText}>Mark all read</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }

              return (
                <NotificationRow
                  item={item}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.includes(item.id)}
                  styles={styles}
                  theme={theme}
                  onPress={handlePressItem}
                  onLongPress={handleLongPressItem}
                  onDelete={handleDeleteItem}
                />
              );
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : !hasMore && notifications.length > 0 ? (
                <Text style={styles.endText}>No more notifications</Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <LinearGradient 
                    colors={theme.isDark ? ['#1A3D30', '#0D1F18'] : ['#F1F5F9', '#E2E8F0']} 
                    style={styles.emptyGradient}
                  >
                    <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.isDark ? theme.primary : theme.text.tertiary} strokeWidth="1.5">
                      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                    </Svg>
                  </LinearGradient>
                </View>
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubText}>We'll notify you when something important happens</Text>
              </View>
            }
          />

          <CustomAlert
            visible={alertVisible}
            theme={theme}
            title="Delete Notification"
            message="Are you sure you want to delete this notification? This action cannot be undone."
            type="warning"
            confirmText="Delete"
            loading={deleting}
            onConfirm={confirmDelete}
            onCancel={() => setAlertVisible(false)}
          />

          <CustomAlert
            visible={bulkAlertVisible}
            theme={theme}
            title={selectedIds.length === 1 ? "Delete Notification" : "Delete Selected"}
            message={`Are you sure you want to delete ${selectedIds.length === 1 ? 'this' : selectedIds.length} notification${selectedIds.length === 1 ? '' : 's'}? This action cannot be undone.`}
            type="warning"
            confirmText={selectedIds.length === 1 ? "Delete" : "Delete All"}
            loading={isBulkDeleting}
            onConfirm={confirmBulkDelete}
            onCancel={() => setBulkAlertVisible(false)}
          />
        </>
      )}
    </View>
  );
};

function makeStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    stickyHeader: {
      backgroundColor: 'transparent',
      zIndex: 100,
    },
    headerActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerLeft: {
      width: 44,
      alignItems: 'flex-start',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerRight: {
      width: 44,
      alignItems: 'flex-end',
    },
    headerDeleteBtn: {
        padding: 4,
    },
    headerTitleCenter: {
     fontSize: 28,
      color: theme.text.primary,
      fontFamily: Typography.extraBold,
      letterSpacing: -0.5,
      marginBottom: 10,
    },
    backgroundGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 380,
    },
    contentPadding: {
      paddingHorizontal: 20,
    },
   
    scrollContent: {
      paddingBottom: 60,
    },
    listContainer: {
      marginTop: 8,
    },
    groupSection: {
      marginBottom: 32,
    },
    groupHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    groupHeader: {
      fontSize: 12,
      fontFamily: Typography.extraBold,
      color: theme.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    groupMarkAllText: {
      fontSize: 13,
      color: theme.primary,
      fontFamily: Typography.bold,
    },
    notificationCard: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.card,
      borderRadius: 24,
      marginBottom: 12,
      shadowColor: theme.isDark ? '#000' : theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    unreadCard: {
      borderColor: theme.isDark ? 'rgba(61, 217, 164, 0.3)' : 'rgba(0, 135, 90, 0.2)',
      borderLeftWidth: 5,
      borderLeftColor: theme.primary,
    },
    iconContainer: {
      width: 52,
      height: 52,
      borderRadius: 16,
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
      color: theme.text.primary,
      flex: 1,
    },
    unreadText: {
      color: theme.text.primary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
      marginLeft: 8,
    },
    itemBody: {
      fontSize: 13,
      fontFamily: Typography.medium,
      color: theme.text.secondary,
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
      fontFamily: Typography.bold,
      color: theme.text.tertiary,
    },
    newBadge: {
      backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.15)' : '#E6F5EF',
      color: theme.primary,
      fontSize: 10,
      fontFamily: Typography.extraBold,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      overflow: 'hidden',
    },
    deleteSwipeAction: {
      backgroundColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
      borderRadius: 24,
      marginBottom: 12,
      marginLeft: 12,
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
      overflow: 'hidden',
      marginBottom: 32,
    },
    emptyGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 24,
      fontFamily: Typography.extraBold,
      color: theme.text.primary,
      marginBottom: 12,
    },
    emptySubText: {
      fontSize: 15,
      fontFamily: Typography.medium,
      color: theme.text.tertiary,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20
    },
    selectedCard: {
        borderColor: theme.primary,
        backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.05)' : '#F0FDF4',
    },
    checkboxContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 50, // Circular checkbox for a more modern look
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.card,
    },
    checkboxActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    bulkFooter: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 20,
        right: 20,
        backgroundColor: 'transparent',
    },
    bulkDeleteBtn: {
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    bulkDeleteText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Typography.bold,
    },
    endText: {
        textAlign: 'center',
        paddingVertical: 20,
        fontSize: 13,
        fontFamily: Typography.medium,
        color: theme.text.tertiary,
    },
  });
}

export default NotificationsScreen;
