import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  StatusBar,
  RefreshControl,
  Animated,
  AppState,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect, G, Defs, ClipPath, Circle } from 'react-native-svg';
import * as authService from '../services/authService';
import * as notificationService from '../services/notificationService';
import * as deliveryService from '../services/deliveryService';
import { useAuthStore } from '../store/authStore';
import { Typography } from '../constants/Typography';
import { useFocusEffect } from '@react-navigation/native';
import RequestAlertModal, {
  RequestAlertData,
} from '../components/common/RequestAlertModal';
import Toast from 'react-native-toast-message';
import { setDeliveryRequestListener } from '../services/fcmService';
import { BASE_URL } from '../utils/endPoints';
import {
  playAlertSound as playGlobalSound,
  stopAlertSound as stopGlobalSound,
} from '../services/soundService';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';
import { useAnnouncementStore } from '../store/announcementStore';
import { useNotificationStore } from '../store/notificationStore';
import * as bannerService from '../services/bannerService';
import { socketService } from '../services/socketService';


const { width } = Dimensions.get('window');
const BANNER_HEIGHT = Math.round(width * 6 / 16);

//Icons for toggle
const SunIcon = ({ color }: { color: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2.5" />
    <Path
      d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

const MoonIcon = ({ color }: { color: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const STATIC_BANNERS = [
  {
    id: '1',
    title: 'Maximize Earnings!',
    desc: 'Complete 5 trips this week for a bonus.',
    bgColors: ['#006C52', '#004A38'],
  },
  {
    id: '2',
    title: 'Top Rated Traveler',
    desc: 'Maintain 5 stars for priority access.',
    bgColors: ['#006C52', '#004A38'],
  },
  {
    id: '3',
    title: 'New Routes Open',
    desc: 'Check out the new high-demand corridors.',
    bgColors: ['#006C52', '#004A38'],
  },
];

const TravelerHomeScreen = ({ navigation }: any) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, token, setUser } = useAuthStore();
  const { unreadCount: announcementUnread } = useAnnouncementStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  const s = makeStyles(theme);

  const toggleActions = () => {
    // Enable LayoutAnimation for Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowActions(!showActions);
  };

  const [displayBanners, setDisplayBanners] = useState<any[]>(STATIC_BANNERS);
  const extendedBanners = [...displayBanners, displayBanners.length > 0 ? { ...displayBanners[0], id: 'clone-1' } : null].filter(Boolean);

  const fetchBanners = useCallback(async () => {
    try {
      const data = await bannerService.getBanners('TRAVELER');
      if (data && data.length > 0) {
        setDisplayBanners(data);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  }, []);

  const playAlertSound = useCallback(() => {
    playGlobalSound();
  }, []);

  const stopAlertSound = useCallback(() => {
    stopGlobalSound();
  }, []);

  useEffect(() => {
    return () => {
      stopGlobalSound();
    };
  }, []);

  const scrollViewRef = useRef<any>(null);
  const currentIndexRef = useRef(0);

  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [pendingRequestData, setPendingRequestData] = useState<RequestAlertData | null>(null);
  const requestModalVisibleRef = useRef(false);
  const requestQueueRef = useRef<RequestAlertData[]>([]);
  const currentMatchIdRef = useRef<string | null>(null);


  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const userData = await authService.getMe(token);
      setUser(userData);
    } catch (error) {
      console.error('Fetch user profile error:', error);
    }
  };

  const formatImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${BASE_URL}/${url.replace(/\\/g, '/')}`;
  };

  // Show a request in the modal (or queue it if modal is already busy)
  const showOrQueueRequest = useCallback((requestData: RequestAlertData, shouldPlaySound: boolean = true) => {
    // Skip if this exact match is already being shown
    if (currentMatchIdRef.current === requestData.matchId) return;

    if (requestModalVisibleRef.current) {
      // Modal is already showing a request — queue this one (if not already queued)
      const alreadyQueued = requestQueueRef.current.some(r => r.matchId === requestData.matchId);
      if (!alreadyQueued) {
        requestQueueRef.current.push(requestData);
        console.log('Request queued:', requestData.matchId, 'Queue length:', requestQueueRef.current.length);
      }
      return;
    }

    // Show immediately
    currentMatchIdRef.current = requestData.matchId;
    setPendingRequestData(requestData);
    if (shouldPlaySound) playAlertSound();
    requestModalVisibleRef.current = true;
    setRequestModalVisible(true);
  }, [playAlertSound]);

  // After handling current request, show next from queue
  const showNextQueuedRequest = useCallback(() => {
    // Don't show next if modal is already showing something (race condition guard)
    if (requestModalVisibleRef.current) return;

    if (requestQueueRef.current.length > 0) {
      const next = requestQueueRef.current.shift()!;
      console.log('Showing next queued request:', next.matchId, 'Remaining in queue:', requestQueueRef.current.length);
      currentMatchIdRef.current = next.matchId;
      setPendingRequestData(next);
      playAlertSound();
      requestModalVisibleRef.current = true;
      setRequestModalVisible(true);
    }
  }, [playAlertSound]);

  const fetchPendingRequests = useCallback(async () => {
    if (!token) return;
    try {
      const data = await deliveryService.getPendingMatches(token);
      const matches = Array.isArray(data) ? data : data?.matches || data?.pendingMatches || [];

      for (const match of matches) {
        const parcel = match.parcel || match;
        const matchId = match.id || match._id;

        // Skip if this match is already being shown or already queued
        if (currentMatchIdRef.current === matchId) continue;
        if (requestQueueRef.current.some(r => r.matchId === matchId)) continue;

        const formattedPhotos = (parcel.imageUrls || [])
          .map((url: string) => formatImageUrl(url))
          .filter(Boolean);
        if (formattedPhotos.length === 0 && (parcel.photoUrl || parcel.image)) {
          const fb = formatImageUrl(parcel.photoUrl || parcel.image);
          if (fb) formattedPhotos.push(fb);
        }

        const createdAt = new Date(match.createdAt).getTime();
        const now = new Date().getTime();
        const diffSeconds = Math.floor((now - createdAt) / 1000);
        const MAX_SECONDS = 10 * 60;
        const remainingSeconds = Math.max(0, MAX_SECONDS - diffSeconds);

        if (remainingSeconds <= 0) {
          if (token) {
            await deliveryService.expireMatch(token, matchId);
          }
          continue;
        }

        showOrQueueRequest({
          matchId,
          parcelPhotos: formattedPhotos,
          parcelTitle: parcel.name || parcel.title || 'New Delivery Request',
          parcelWeight: parcel.weight ? `${parcel.weight} kg` : undefined,
          fromLocation: parcel.fromLocation || match.fromLocation,
          toLocation: parcel.toLocation || match.toLocation,
          senderName: match.sender?.name || parcel.senderName || 'DropMate User',
          senderRating: match.sender?.customerRating ?? match.parcel?.sender?.customerRating ?? 0,
          offerPrice: match.offerPrice?.toString() || parcel.price?.toString() || parcel.offerPrice?.toString(),
          paymentMethod: parcel.paymentMethod,
          remainingSeconds: remainingSeconds,
        }, false); // False for background catch-up
      }
    } catch (error) {
      console.log('Error fetching pending requests:', error);
    }
  }, [token, showOrQueueRequest]);

  const handleAcceptRequest = useCallback(
    async (matchId: string) => {
      if (!token) return;
      try {
        await deliveryService.acceptMatch(token, matchId);
        stopAlertSound();
        currentMatchIdRef.current = null;
        requestModalVisibleRef.current = false;
        setRequestModalVisible(false);
        setPendingRequestData(null);
        Toast.show({
          type: 'success',
          text1: '✅ Request Accepted!',
          text2: 'The sender has been notified. Good luck!',
        });
        if (token) fetchUnreadCount(token);
        // Show next queued request after a short delay for smooth UX
        setTimeout(() => showNextQueuedRequest(), 600);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error?.message || 'Failed to accept request.',
        });
        throw error;
      }
    },
    [token, stopAlertSound, showNextQueuedRequest],
  );

  const handleDeclineRequest = useCallback(
    async (matchId: string, reason: string) => {
      if (!token) return;
      try {
        await deliveryService.rejectMatchWithReason(token, matchId, reason);
        stopAlertSound();
        currentMatchIdRef.current = null;
        requestModalVisibleRef.current = false;
        setRequestModalVisible(false);
        setPendingRequestData(null);
        Toast.show({
          type: 'info',
          text1: 'Request Declined',
          text2: 'The sender has been notified.',
        });
        if (token) fetchUnreadCount(token);
        // Show next queued request after a short delay
        setTimeout(() => showNextQueuedRequest(), 600);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error?.message || 'Failed to decline request.',
        });
        throw error;
      }
    },
    [token, stopAlertSound, showNextQueuedRequest],
  );

  const handleExpireRequest = useCallback(
    async (matchId: string) => {
      if (!token) return;
      try {
        await deliveryService.expireMatch(token, matchId);
        stopAlertSound();
        currentMatchIdRef.current = null;
        requestModalVisibleRef.current = false;
        setRequestModalVisible(false);
        setPendingRequestData(null);
        Toast.show({
          type: 'info',
          text1: '⏰ Request Expired',
          text2: 'You did not respond in time.',
        });
        // Show next queued request after a short delay
        setTimeout(() => showNextQueuedRequest(), 600);
      } catch (error: any) {
        console.log('Expire match error:', error);
        requestModalVisibleRef.current = false;
        setRequestModalVisible(false);
        // Still try to show next queued request
        setTimeout(() => showNextQueuedRequest(), 600);
      }
    },
    [token, stopAlertSound, showNextQueuedRequest],
  );

  useEffect(() => {
    setDeliveryRequestListener(async (fcmData: any) => {
      if (!fcmData || !fcmData.matchId) {
        fetchPendingRequests();
        return;
      }

      let parcelPhotos: string[] = [];
      try {
        if (fcmData.imageUrls) {
          const rawUrls = JSON.parse(fcmData.imageUrls);
          parcelPhotos = rawUrls.map((url: string) => formatImageUrl(url));
        }
      } catch (e) { }

      const createdAt = fcmData.createdAt ? new Date(fcmData.createdAt).getTime() : new Date().getTime();
      const now = new Date().getTime();
      const diffSeconds = Math.floor((now - createdAt) / 1000);
      const MAX_SECONDS = 10 * 60;
      const remainingSeconds = Math.max(0, MAX_SECONDS - diffSeconds);

      if (remainingSeconds <= 0) {
        if (token) await deliveryService.expireMatch(token, fcmData.matchId);
        return;
      }

      const requestData: RequestAlertData = {
        matchId: fcmData.matchId,
        parcelPhotos,
        parcelTitle: fcmData.parcelTitle || 'New Delivery Request',
        parcelWeight: fcmData.parcelWeight ? `${fcmData.parcelWeight} kg` : undefined,
        fromLocation: fcmData.fromLocation,
        toLocation: fcmData.toLocation,
        senderName: fcmData.senderName || 'DropMate User',
        senderRating: fcmData.senderRating || 0,
        offerPrice: fcmData.offerPrice?.toString(),
        paymentMethod: fcmData.paymentMethod,
        remainingSeconds,
      };

      showOrQueueRequest(requestData, fcmData.origin === 'foreground');
    });

    return () => {
      setDeliveryRequestListener(null);
    };
  }, [token, fetchPendingRequests, showOrQueueRequest]);

  // 🔌 Socket listener: auto-close modal when customer cancels their request
  useEffect(() => {
    const socket = (socketService as any).socket;
    if (!socket) return;

    const handleRequestCancelled = ({ matchId }: { matchId: string }) => {
      console.log('Socket: request_cancelled received for matchId:', matchId);

      // Remove from queue if it was waiting
      requestQueueRef.current = requestQueueRef.current.filter(
        (r) => r.matchId !== matchId
      );

      // If the modal is currently showing this exact request → close it
      if (currentMatchIdRef.current === matchId) {
        stopAlertSound();
        currentMatchIdRef.current = null;
        requestModalVisibleRef.current = false;
        setRequestModalVisible(false);
        setPendingRequestData(null);
        Toast.show({
          type: 'info',
          text1: 'Request Withdrawn',
          text2: 'The sender has cancelled this delivery request.',
          visibilityTime: 4000,
        });
        // Show next queued request if any
        setTimeout(() => showNextQueuedRequest(), 600);
      }
    };

    socket.on('request_cancelled', handleRequestCancelled);

    return () => {
      socket.off('request_cancelled', handleRequestCancelled);
    };
  }, [stopAlertSound, showNextQueuedRequest]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchPendingRequests();
        if (token) fetchUnreadCount(token);
      }
    });
    return () => subscription.remove();
  }, [fetchPendingRequests, fetchUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      if (token) fetchUnreadCount(token);
      fetchPendingRequests();
      fetchBanners();
    }, [token, fetchPendingRequests, fetchBanners]),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndexRef.current + 1;
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: nextIndex * width, animated: true });
      }
      currentIndexRef.current = nextIndex;
      if (nextIndex === displayBanners.length) {
        setTimeout(() => {
          if (scrollViewRef.current) scrollViewRef.current.scrollTo({ x: 0, animated: false });
          currentIndexRef.current = 0;
        }, 500);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [displayBanners.length]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const userData = await authService.getMe(token);
      setUser(userData);
      fetchUnreadCount(token);
      fetchBanners();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  const userName = user?.name || 'Traveler';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <View style={s.headerContainer}>
        <TouchableOpacity style={s.userInfoRow} activeOpacity={0.7}>
          <View style={s.avatarBorder}>
            {user?.selfieUrl ? (
              <Image source={{ uri: user.selfieUrl }} style={s.avatarImage} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={s.greetingTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.greetingText}>{getGreeting()}</Text>
              <View style={s.modeIndicator}>
                <View style={s.activeDot} />
                <Text style={s.modeText}>Traveler</Text>
              </View>
              {!!(user && user.travelerRating && user.travelerRating > 0) && (
                <View style={s.ratingBadge}>
                  <Svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B">
                    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                  </Svg>
                  <Text style={s.ratingValue}>{Number(user.travelerRating).toFixed(1)}</Text>
                </View>
              )}
            </View>
            <Text style={s.userNameText} numberOfLines={1}>Hi, {userName}</Text>
          </View>
        </TouchableOpacity>

        <View style={s.headerRightActions}>
          <TouchableOpacity
            style={[s.notificationBtn, { backgroundColor: 'transparent', marginRight: -10 }]}
            activeOpacity={0.7}
            onPress={toggleActions}>
            <View style={{ transform: [{ rotate: showActions ? '180deg' : '0deg' }] }}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M6 9l6 6 6-6" />
              </Svg>
            </View>
            {!showActions && (announcementUnread > 0 || unreadCount > 0) && (
              <View style={[s.notifBadge, { top: -2, right: -2, width: 12, height: 12, borderRadius: 6, minWidth: 0, padding: 0 }]} />
            )}
          </TouchableOpacity>

          {showActions && (
            <View style={s.dropdownActions}>
              <TouchableOpacity
                style={s.notificationBtn}
                activeOpacity={0.7}
                onPress={() => {
                  toggleTheme();
                  toggleActions();
                }}
              >
                {isDark ? (
                  <SunIcon color={theme.primary} />
                ) : (
                  <MoonIcon color={theme.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={s.notificationBtn}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('Announcements');
                  toggleActions();
                }}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                  <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  <Path d="M12 8v4" />
                  <Path d="M12 16h.01" />
                </Svg>
                {announcementUnread > 0 && (
                  <View style={s.notifBadge}>
                    <Text style={s.notifBadgeText}>{announcementUnread > 99 ? '99+' : announcementUnread}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={s.notificationBtn}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('Notifications');
                  toggleActions();
                }}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                  <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
                  <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" />
                </Svg>
                {unreadCount > 0 && (
                  <View style={s.notifBadge}>
                    <Text style={s.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
        }>

        <View style={s.bannerSection}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
            onMomentumScrollEnd={(event: any) => {
              const x = event.nativeEvent.contentOffset.x;
              let index = Math.round(x / width);
              if (index === displayBanners.length) {
                if (scrollViewRef.current) scrollViewRef.current.scrollTo({ x: 0, animated: false });
                index = 0;
              }
              currentIndexRef.current = index;
            }}
            scrollEventThrottle={16}>
            {extendedBanners.map((banner) => (
              <View key={banner.id} style={s.bannerWrapper}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    console.log('Banner pressed:', banner.id, 'Link:', banner.link);
                    if (banner.link) {
                      bannerService.openLink(banner.link);
                    } else {
                      console.log('No link for this banner');
                    }
                  }}
                  style={s.bannerTouch}
                >
                  <LinearGradient
                    colors={banner.bgColors || (isDark ? ['#006C52', '#004A38'] : ['#008766', '#006C52'])}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.bannerContainer, banner.imageUrl ? { padding: 0 } : null]}
                  >
                    {banner.imageUrl && (
                      <Image
                        source={{ uri: formatImageUrl(banner.imageUrl) }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
                        resizeMode="cover"
                      />
                    )}
                    <View style={s.bannerContent}>
                      <Text style={s.bannerTitle}>{banner.title}</Text>
                      <Text style={s.bannerDesc}>{banner.description || banner.desc}</Text>
                    </View>
                    <View style={s.bannerIconOverlay}>
                      <Svg width="120" height="120" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.1, transform: [{ rotate: '-15deg' }, { scale: 1.5 }] }}>
                        <Path d="M5 12h14M12 5l7 7-7 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </Animated.ScrollView>

          <View style={s.dotsContainer}>
            {displayBanners.length > 1 && displayBanners.map((_, i) => {
              const inputRange = i === 0
                ? [-width, 0, width, (displayBanners.length - 1) * width, displayBanners.length * width, (displayBanners.length + 1) * width]
                : [(i - 1) * width, i * width, (i + 1) * width];

              // Ensure inputRange is monotonically non-decreasing by filtering duplicates and sorting if length is small
              // Actually, if length is > 1 it should be fine except for the cloned parts.
              // Let's simplify for 1 banner case by checking length.

              const outputWidth = i === 0 ? [8, 24, 8, 8, 24, 8] : [8, 24, 8];
              const outputOpacity = i === 0 ? [0.3, 1, 0.3, 0.3, 1, 0.3] : [0.3, 1, 0.3];
              const dotWidth = scrollX.interpolate({ inputRange, outputRange: outputWidth, extrapolate: 'clamp' });
              const opacity = scrollX.interpolate({ inputRange, outputRange: outputOpacity, extrapolate: 'clamp' });
              return (
                <Animated.View key={i.toString()} style={[s.dot, { width: dotWidth, opacity, backgroundColor: theme.primary }]} />
              );
            })}
          </View>
        </View>

        <View style={s.cardsSection}>
          {!user?.isTravelerApproved && (
            <View style={s.reviewCard}>
              <View style={s.reviewCardContent}>
                <View style={s.reviewIconContainer}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.isDark ? theme.primary : '#00513D'} strokeWidth="2">
                    <Path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                  </Svg>
                </View>
                <View style={s.reviewTextContent}>
                  <Text style={s.reviewTitleDark}>Verification in Progress</Text>
                  <Text style={s.reviewDescDark}>Validating your documents. Takes 24-48 hours.</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={s.dashboardSection}>
          <Text style={s.sectionHeader}>Traveler Dashboard</Text>
          <View style={s.gridContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('HelpCenter')} style={s.gridCard} activeOpacity={0.8}>
              <View style={s.gridIconHeader}>
                <View style={s.gridIconBox}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                    <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </Svg>
                </View>
              </View>
              <Text style={s.gridTitle}>Help Center</Text>
              <Text style={s.gridDesc}>Get support & FAQs.</Text>
            </TouchableOpacity>

            {user?.isTravelerApproved ? (
              <TouchableOpacity style={s.gridCard} activeOpacity={0.8} onPress={() => navigation.navigate('TravelerEarnings')}>
                <View style={s.gridIconHeader}>
                  <View style={s.gridIconBox}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                      <Path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </Svg>
                  </View>
                </View>
                <Text style={s.gridTitle}>My Wallet</Text>
                <Text style={s.gridDesc}>Manage your Wallet.</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.gridCard} activeOpacity={0.8} onPress={() => navigation.navigate('Profile')}>
                <View style={s.gridIconHeader}>
                  <View style={s.gridIconBox}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
                    </Svg>
                  </View>
                </View>
                <Text style={s.gridTitle}>Profile</Text>
                <Text style={s.gridDesc}>Complete verification.</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={s.exploreSection}>
          <Text style={s.sectionHeader}>Explore DropMate</Text>
          <View style={s.exploreBannerCard}>
            <View style={s.exploreGradient}>
              <View style={s.exploreInfo}>
                <Text style={s.exploreTitle}>How DropMate Works?</Text>
                <Text style={s.exploreDesc}>Learn how to maximize your traveler earnings and provide secure delivery.</Text>
                <TouchableOpacity
                  style={s.exploreLinkBtn}
                  activeOpacity={0.8}
                  onPress={() => bannerService.openLink('https://www.dropmate.lk')}
                >
                  <Text style={s.exploreLinkText}>Learn More</Text>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
                    <Path d="M5 12h14M12 5l7 7-7 7" />
                  </Svg>
                </TouchableOpacity>
              </View>
              <View style={s.exploreIconBox}>
                <View style={s.iconCircle}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Circle cx="12" cy="12" r="10" />
                    <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
                  </Svg>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <RequestAlertModal
        visible={requestModalVisible}
        data={pendingRequestData}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
        onExpire={handleExpireRequest}
      />
    </SafeAreaView>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.background,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userInfoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#E7F5EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    backgroundColor: theme.isDark ? '#1E293B' : '#C3E8DA',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    color: theme.primary,
    fontFamily: Typography.bold,
    fontSize: 18,
  },
  greetingTextContainer: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 18,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  greetingText: {
    fontSize: 14,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
  },
  modeIndicator: {
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(61, 217, 164, 0.2)' : '#D1FAE5',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 4,
  },
  modeText: {
    fontSize: 9,
    color: '#059669',
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
  },
  ratingValue: {
    fontSize: 10,
    color: '#F59E0B',
    fontFamily: Typography.bold,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -8,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.background,
  },
  dropdownActions: {
    position: 'absolute',
    top: 55,
    right: -10,
    backgroundColor: theme.isDark ? theme.card : '#FFFFFF',
    borderRadius: 22,
    padding: 8,
    gap: 12,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Typography.bold,
  },
  scrollContent: {
    paddingTop: 8,
  },
  bannerSection: {
    marginBottom: 24,
  },
  bannerWrapper: {
    width: width,
    paddingHorizontal: 24,
  },
  bannerTouch: {
    width: '100%',
    height: BANNER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerContainer: {
    width: '100%',
    height: '100%',
    padding: 18,
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerContent: {
    zIndex: 2,
    width: '70%',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: Typography.bold,
    marginBottom: 8,
    lineHeight: 28,
  },
  bannerDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: Typography.medium,
    lineHeight: 18,
  },
  bannerIconOverlay: {
    position: 'absolute',
    right: -20,
    bottom: -10,
    zIndex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  sectionHeader: {
    fontSize: 18,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 16,
  },
  cardsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  reviewCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.3 : 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reviewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#E7F5EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewTextContent: {
    flex: 1,
  },
  reviewTitleDark: {
    fontSize: 16,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  reviewDescDark: {
    fontSize: 13,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
    lineHeight: 18,
  },
  dashboardSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCard: {
    width: (width - 48 - 16) / 2,
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.3 : 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  gridIconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gridIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: theme.border,
  },
  gridTitle: {
    fontSize: 16,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  gridDesc: {
    fontSize: 12,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
    lineHeight: 16,
  },
  exploreSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  exploreBannerCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  exploreGradient: {
    backgroundColor: theme.isDark ? theme.card : '#F0FDF4',
    borderRadius: 24,
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border,
  },
  exploreInfo: {
    flexShrink: 1,
    paddingRight: 8,
  },
  exploreTitle: {
    fontSize: 16,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  exploreDesc: {
    fontSize: 12,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
    lineHeight: 16,
    marginBottom: 12,
    opacity: 0.8,
  },
  exploreLinkBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  exploreLinkText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: Typography.bold,
  },
  exploreIconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default TravelerHomeScreen;
