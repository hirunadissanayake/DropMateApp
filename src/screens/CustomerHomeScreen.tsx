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
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import * as authService from '../services/authService';
import * as parcelService from '../services/parcelService';
import * as tripService from '../services/tripService';
import * as notificationService from '../services/notificationService';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

import { Typography } from '../constants/Typography';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';
import { useAnnouncementStore } from '../store/announcementStore';

const { width } = Dimensions.get('window');

// ── Icons for toggle ──
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

const BANNERS = [
  {
    id: '1',
    title: 'DropMate Premium',
    subtitle: 'Get priority matching and zero insurance fees.',
    colors: ['#006C52', '#064E3B'],
    icon: 'package'
  },
  {
    id: '2',
    title: 'Track Every Move',
    subtitle: 'Real-time updates on your valuable parcels.',
    colors: ['#006C52', '#064E3B'],
    icon: 'map'
  }
];

const EXTENDED_BANNERS = [...BANNERS, { ...BANNERS[0], id: 'clone-1' }];

const CustomerHomeScreen = ({ navigation }: any) => {
  const { user, token, setUser } = useAuthStore();
  const { unreadCount: announcementUnread } = useAnnouncementStore();
  const { theme, isDark, toggleTheme } = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeParcels, setActiveParcels] = useState<any[]>([]);
  const [recommendedTrips, setRecommendedTrips] = useState<any[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef<any>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndexRef.current + 1;
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: nextIndex * width, animated: true });
      }
      currentIndexRef.current = nextIndex;

      if (nextIndex === BANNERS.length) {
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: 0, animated: false });
          }
          currentIndexRef.current = 0;
        }, 500);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveParcels = async () => {
    if (!token || !user?.isCustomerApproved || user?.roleActive !== 'CUSTOMER') {
      setLoadingParcels(false);
      return;
    }
    try {
      const data = await parcelService.getMyParcels(token);
      const active = data.filter((p: any) => {
        const s = p.status?.toUpperCase();
        return s === 'PENDING' || s === 'IN_TRANSIT' || s === 'MATCHED';
      });
      setActiveParcels(active);
    } catch (error) {
      console.error('Fetch active parcels error:', error);
    } finally {
      setLoadingParcels(false);
    }
  };

  const fetchRecommendedTrips = async () => {
    if (!token || !user?.isCustomerApproved || user?.roleActive !== 'CUSTOMER') {
      setLoadingTrips(false);
      return;
    }
    try {
      const response = await tripService.getActiveTrips(token);
      setRecommendedTrips(response.trips?.slice(0, 5) || []);
    } catch (error) {
      console.error('Fetch recommended trips error:', error);
    } finally {
      setLoadingTrips(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const data = await notificationService.getNotifications(token);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const userData = await authService.getMe(token);
      setUser(userData);
    } catch (error) {
      console.error('Fetch user profile error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchActiveParcels();
      fetchRecommendedTrips();
      fetchUnreadCount();
    }, [token, user?.isCustomerApproved])
  );

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const userData = await authService.getMe(token);
      setUser(userData);
      
      if (userData.isCustomerApproved && userData.roleActive === 'CUSTOMER') {
        const pData = await parcelService.getMyParcels(token);
        const active = pData.filter((p: any) => {
          const s = p.status?.toUpperCase();
          return s === 'PENDING' || s === 'IN_TRANSIT' || s === 'MATCHED';
        });
        setActiveParcels(active);
        const tripResponse = await tripService.getActiveTrips(token);
        setRecommendedTrips(tripResponse.trips?.slice(0, 5) || []);
      }
      fetchUnreadCount();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
      setLoadingParcels(false);
      setLoadingTrips(false);
    }
  }, [token, setUser]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />

      {/* Modern Header */}
      <View style={s.headerContainer}>
        <TouchableOpacity 
          style={s.headerLeft} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={s.avatarContainer}>
            {user?.selfieUrl ? (
              <Image source={{ uri: user.selfieUrl }} style={s.avatarImage} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{getInitial(user?.name || '')}</Text>
              </View>
            )}
          </View>
          <View style={{ flexShrink: 1 }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Text style={s.greetingText}>{getGreeting()},</Text>
              <View style={s.modeIndicator}>
                <View style={s.activeDot} />
                <Text style={s.modeText}>Customer</Text>
              </View>
            </View>
            <Text style={s.userName} numberOfLines={1}>{user?.name || 'Guest'}</Text>
          </View>
        </TouchableOpacity>

        <View style={s.headerRightActions}>
          {/* Theme Toggle Button */}
          <TouchableOpacity 
            style={s.notificationBtn} 
            activeOpacity={0.7}
            onPress={toggleTheme}
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
            onPress={() => navigation.navigate('Announcements')}
          >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              <Path d="M12 8v4" /><Path d="M12 16h.01" />
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
            onPress={() => navigation.navigate('Notifications')}
          >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      </View>

      <ScrollView 
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Banner Carousel */}
        <View style={s.bannerSection}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {EXTENDED_BANNERS.map((banner) => (
              <View key={banner.id} style={s.bannerWrapper}>
                <LinearGradient
                  colors={banner.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.bannerCard}
                >
                  <View style={s.bannerContent}>
                    <Text style={s.bannerTitle}>{banner.title}</Text>
                    <Text style={s.bannerSubtitle}>{banner.subtitle}</Text>
                  </View>
                  <View style={s.bannerIconBox}>
                    {renderServiceIcon(banner.icon, 'rgba(255,255,255,0.2)', 80)}
                  </View>
                </LinearGradient>
              </View>
            ))}
          </Animated.ScrollView>
          <View style={s.dotContainer}>
            {BANNERS.map((_, i) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [8, 20, 8],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View 
                  key={i} 
                  style={[s.dot, { width: dotWidth, opacity, backgroundColor: theme.primary }]} 
                />
              );
            })}
          </View>
        </View>

        {/* Restricted Warning for Unapproved Users */}
        {!user?.isCustomerApproved && (
          <View style={s.verificationCard}>
            <View style={s.verificationIconBox}>
               <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <Circle cx="12" cy="11" r="3" />
                  <Path d="M7 16c0-1.5 2.239-3 5-3s5 1.5 5 3" />
               </Svg>
            </View>
            <Text style={s.verificationTitle}>Profile Under Review</Text>
            <Text style={s.verificationDesc}>
              Your verification is currently in progress. This usually takes 24 to 28 hours. We'll notify you as soon as your account is approved!
            </Text>
            <View style={s.statusBadgePending}>
               <Text style={s.statusTextPending}>Pending Approval</Text>
            </View>
          </View>
        )}

        {/* Content visible ONLY to Approved Users */}
        {user?.isCustomerApproved && (
          <>
            <View style={s.customerActions}>
              <TouchableOpacity 
                style={s.primaryAction}
                onPress={() => navigation.navigate('CreateParcel')}
              >
                <View style={s.actionIconCircle}>
                   {renderServiceIcon('package', theme.primary, 28)}
                </View>
                <View style={s.actionTextContent}>
                  <Text style={s.actionLabel}>Send a Parcel</Text>
                  <Text style={s.actionDesc}>Reliable peer-to-peer delivery</Text>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                   <Path d="M9 18l6-6-6-6" />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity 
                style={s.secondaryAction}
                onPress={() => navigation.navigate('Find Travelers')}
              >
                <View style={s.actionIconCircle}>
                   {renderServiceIcon('map', theme.primary, 24)}
                </View>
                <View style={s.actionTextContent}>
                  <Text style={s.actionLabel}>Discover Trips</Text>
                  <Text style={s.actionDesc}>Find travelers headed your way</Text>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                   <Path d="M9 18l6-6-6-6" />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Active Shipments */}
            <View style={s.section}>
              <View style={s.sectionHeaderRow}>
                <Text style={s.sectionHeader}>Active Shipments</Text>
                {activeParcels.length > 0 && (
                  <TouchableOpacity onPress={() => navigation.navigate('Shipments')}>
                    <Text style={s.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {loadingParcels ? (
                <View style={s.loadingBox}>
                  <ActivityIndicator color={theme.primary} />
                </View>
              ) : activeParcels.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={s.horizontalScroll}
                >
                  {activeParcels.map((parcel) => (
                    <ActiveOrderCard 
                      key={parcel.id}
                      theme={theme}
                      id={`#${parcel.id.slice(-6).toUpperCase()}`} 
                      status={parcel.status} 
                      from={parcel.fromLocation}
                      to={parcel.toLocation}
                      time={dayjs(parcel.createdAt).format('MMM DD')}
                      color={parcel.status === 'PENDING' ? '#F59E0B' : theme.primary}
                      onPress={() => navigation.navigate('ParcelDetails', { parcelId: parcel.id })}
                    />
                  ))}
                </ScrollView>
              ) : (
                <TouchableOpacity 
                  style={s.emptyCard}
                  onPress={() => navigation.navigate('CreateParcel')}
                >
                  <View style={s.emptyIconBox}>
                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <Path d="M12 12V22" /><Path d="M12 12l8.73-5.04" /><Path d="M12 12L3.27 6.96" />
                    </Svg>
                  </View>
                  <Text style={s.emptyTitle}>No active shipments</Text>
                  <Text style={s.emptyDesc}>Start by sending your first parcel today!</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Explore Card */}
        <View style={s.section}>
          <Text style={s.sectionHeader}>Explore DropMate</Text>
          <TouchableOpacity style={s.exploreCard} activeOpacity={0.9}>
            <View style={s.exploreContainer}>
              <View style={s.exploreContent}>
                <Text style={s.exploreTitle}>How it works?</Text>
                <Text style={s.exploreDesc}>Learn how DropMate connects you with travelers for faster delivery.</Text>
                <View style={s.exploreBtn}>
                  <Text style={s.exploreBtnText}>Learn More</Text>
                </View>
              </View>
              <View style={s.exploreIconBox}>
                <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
                </Svg>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ActiveOrderCard = ({ id, status, from, to, time, color, onPress, theme }: any) => {
  const displayStatus = status?.toUpperCase() === 'MATCHED' ? 'ACCEPTED' : status;
  const isAccepted = displayStatus?.toUpperCase() === 'ACCEPTED';
  const s = makeStyles(theme);

  return (
    <TouchableOpacity style={s.activeOrderCard} activeOpacity={0.9} onPress={onPress}>
      <View style={s.orderHeader}>
        <Text style={s.orderId}>{id}</Text>
        <View style={[s.statusBadge, { backgroundColor: color + '15' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isAccepted && (
              <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            )}
            <Text style={[s.statusText, { color }]}>{displayStatus}</Text>
          </View>
        </View>
      </View>
      
      <View style={s.routeContainer}>
        <View style={s.routeIcons}>
          <View style={[s.routeDot, { backgroundColor: theme.primary }]} />
          <View style={s.routeLine} />
          <View style={[s.routeDot, { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.card }]} />
        </View>
        <View style={s.routeTexts}>
          <Text style={s.locationText} numberOfLines={1}>{from}</Text>
          <Text style={s.locationText} numberOfLines={1}>{to}</Text>
        </View>
      </View>

      <View style={s.orderFooter}>
        <Text style={s.orderTime}>{time}</Text>
        <View style={s.footerAction}>
          <Text style={s.viewDetailsText}>View Details</Text>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5">
            <Path d="M5 12h14M12 5l7 7-7 7" />
          </Svg>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const renderServiceIcon = (name: string, color: string, size = 24) => {
  if(name === 'package') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05" /><Path d="M12 22.08V12" />
    </Svg>
  );
  if(name === 'map') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><Circle cx="12" cy="10" r="3" />
    </Svg>
  );
  return null;
}

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.background,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 12,
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.isDark ? '#334155' : '#F1F5F9',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: Typography.bold,
  },
  greetingText: {
    fontSize: 13,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
  },
  userName: {
    fontSize: 17,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    flexShrink: 1,
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
    backgroundColor: theme.isDark ? theme.primary : '#059669',
    marginRight: 4,
  },
  modeText: {
    fontSize: 10,
    color: theme.isDark ? theme.primary : '#059669',
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Typography.bold,
  },
  scrollContent: {
    paddingBottom: 20,
    backgroundColor: theme.background,
  },
  bannerSection: {
    marginVertical: 20,
  },
  bannerWrapper: {
    width: width,
    paddingHorizontal: 20,
  },
  bannerCard: {
    height: 130,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    zIndex: 2,
  },
  bannerTitle: {
    fontSize: 22,
    color: '#FFF',
    fontFamily: Typography.bold,
    lineHeight: 28,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.medium,
    marginTop: 4,
  },
  bannerIconBox: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 1,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  verificationCard: {
    backgroundColor: theme.card,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 30,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.isDark ? 0.3 : 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  verificationIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : 'rgba(0, 108, 82, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 20,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    textAlign: 'center',
  },
  verificationDesc: {
    fontSize: 14,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
    opacity: 0.8,
  },
  statusBadgePending: {
    backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
  },
  statusTextPending: {
    color: theme.isDark ? '#F59E0B' : '#92400E',
    fontSize: 14,
    fontFamily: Typography.bold,
  },
  customerActions: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 18,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  actionDesc: {
    fontSize: 13,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 18,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  viewAllText: {
    fontSize: 13,
    color: theme.primary,
    fontFamily: Typography.bold,
  },
  loadingBox: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalScroll: {
    paddingRight: 20,
    gap: 15,
  },
  activeOrderCard: {
    width: width * 0.75,
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDark ? 0.3 : 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderId: {
    fontSize: 14,
    color: theme.text.secondary,
    fontFamily: Typography.bold,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
  },
  routeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  routeIcons: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.border,
    marginVertical: 4,
  },
  routeTexts: {
    flex: 1,
    gap: 12,
  },
  locationText: {
    fontSize: 14,
    color: theme.text.primary,
    fontFamily: Typography.semiBold,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  orderTime: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewDetailsText: {
    fontSize: 12,
    color: theme.primary,
    fontFamily: Typography.bold,
  },
  emptyCard: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 16,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  emptyDesc: {
    fontSize: 13,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  exploreContainer: {
    backgroundColor: theme.isDark ? theme.card : '#F8FAFC',
    borderRadius: 24,
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border,
  },
  exploreCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  exploreContent: {
    flex: 1,
  },
  exploreTitle: {
    fontSize: 18,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  exploreDesc: {
    fontSize: 13,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
    marginTop: 4,
    marginBottom: 15,
    lineHeight: 18,
    opacity: 0.8,
  },
  exploreBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  exploreBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: Typography.bold,
  },
  exploreIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default CustomerHomeScreen;
