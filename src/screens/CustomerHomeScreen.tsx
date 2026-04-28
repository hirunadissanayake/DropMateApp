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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect, G, Defs, ClipPath } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import * as authService from '../services/authService';
import * as parcelService from '../services/parcelService';
import * as tripService from '../services/tripService';
import * as notificationService from '../services/notificationService';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

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

import { useAnnouncementStore } from '../store/announcementStore';

const CustomerHomeScreen = ({ navigation }: any) => {
  const { user, token, setUser } = useAuthStore();
  const { unreadCount: announcementUnread } = useAnnouncementStore();
  const [refreshing, setRefreshing] = useState(false);
  // ... rest of state
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
    console.log('[DEBUG] Fetching parcels - Status:', { 
      hasToken: !!token, 
      isApproved: user?.isCustomerApproved, 
      role: user?.roleActive 
    });

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
      // Just take the first 5 for recommendation
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
        // Fetch parcels
        const pData = await parcelService.getMyParcels(token);
        const active = pData.filter((p: any) => {
          const s = p.status?.toUpperCase();
          return s === 'PENDING' || s === 'IN_TRANSIT' || s === 'MATCHED';
        });
        setActiveParcels(active);
        
        // Fetch trips
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

  const handleRestrictedAction = (routeName: string, params?: any) => {
    if (!user?.isCustomerApproved) {
      // Show alert or navigation to verification
      navigation.navigate('Verification');
      return;
    }
    navigation.navigate(routeName, params);
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Modern Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.headerLeft} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.avatarContainer}>
            {user?.selfieUrl ? (
              <Image source={{ uri: user.selfieUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{getInitial(user?.name || '')}</Text>
              </View>
            )}
          </View>
          <View style={{ flexShrink: 1 }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <View style={styles.modeIndicator}>
                <View style={styles.activeDot} />
                <Text style={styles.modeText}>Customer</Text>
              </View>
            </View>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Guest'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity 
            style={styles.notificationBtn} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Announcements')}
          >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              <Path d="M12 8v4" /><Path d="M12 16h.01" />
            </Svg>
            {announcementUnread > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{announcementUnread > 99 ? '99+' : announcementUnread}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.notificationBtn} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
              <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" />
            </Svg>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        
        {/* Banner Carousel */}
        <View style={styles.bannerSection}>
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
              <View key={banner.id} style={styles.bannerWrapper}>
                <LinearGradient
                  colors={banner.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bannerCard}
                >
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  </View>
                  <View style={styles.bannerIconBox}>
                    {renderServiceIcon(banner.icon, 'rgba(255,255,255,0.2)', 80)}
                  </View>
                </LinearGradient>
              </View>
            ))}
          </Animated.ScrollView>
          <View style={styles.dotContainer}>
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
                  style={[styles.dot, { width: dotWidth, opacity, backgroundColor: Colors.primary }]} 
                />
              );
            })}
          </View>
        </View>
        {/* Restricted Warning for Unapproved Users */}
        {!user?.isCustomerApproved && (
          <View style={styles.verificationCard}>
            <View style={[styles.verificationIconBox, { backgroundColor: Colors.primary + '15' }]}>
               <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="1.5">
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <Circle cx="12" cy="11" r="3" />
                  <Path d="M7 16c0-1.5 2.239-3 5-3s5 1.5 5 3" />
               </Svg>
            </View>
            <Text style={styles.verificationTitle}>Profile Under Review</Text>
            <Text style={styles.verificationDesc}>
              Your verification is currently in progress. This usually takes 24 to 28 hours. We'll notify you as soon as your account is approved!
            </Text>
            <View style={styles.statusBadgePending}>
               <Text style={styles.statusTextPending}>Pending Approval</Text>
            </View>
          </View>
        )}

        {/* Content visible ONLY to Approved Users */}
        {user?.isCustomerApproved && (
          <>
            {/* Core Actions - Different from Traveler Grid */}
            <View style={styles.customerActions}>
              <TouchableOpacity 
                style={styles.primaryAction}
                onPress={() => navigation.navigate('CreateParcel')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#F0F9FF' }]}>
                   {renderServiceIcon('package', '#006C52', 28)}
                </View>
                <View style={styles.actionTextContent}>
                  <Text style={styles.actionLabel}>Send a Parcel</Text>
                  <Text style={styles.actionDesc}>Reliable peer-to-peer delivery</Text>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2">
                   <Path d="M9 18l6-6-6-6" />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => navigation.navigate('Find Travelers')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#F0F9FF' }]}>
                   {renderServiceIcon('map', '#006C52', 24)}
                </View>
                <View style={styles.actionTextContent}>
                  <Text style={styles.actionLabelDark}>Discover Trips</Text>
                  <Text style={styles.actionDescDark}>Find travelers headed your way</Text>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2">
                   <Path d="M9 18l6-6-6-6" />
                </Svg>
              </TouchableOpacity>
            </View>


            {/* Active Shipments */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Active Shipments</Text>
                {activeParcels.length > 0 && (
                  <TouchableOpacity onPress={() => navigation.navigate('Shipments')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>

              {loadingParcels ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={Colors.primary} />
                </View>
              ) : activeParcels.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {activeParcels.map((parcel) => (
                    <ActiveOrderCard 
                      key={parcel.id}
                      id={`#${parcel.id.slice(-6).toUpperCase()}`} 
                      status={parcel.status} 
                      from={parcel.fromLocation}
                      to={parcel.toLocation}
                      time={dayjs(parcel.createdAt).format('MMM DD')}
                      color={parcel.status === 'PENDING' ? '#F59E0B' : Colors.primary}
                      onPress={() => navigation.navigate('ParcelDetails', { parcelId: parcel.id })}
                    />
                  ))}
                </ScrollView>
              ) : (
                <TouchableOpacity 
                  style={styles.emptyCard}
                  onPress={() => navigation.navigate('CreateParcel')}
                >
                  <View style={styles.emptyIconBox}>
                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <Path d="M12 12V22" /><Path d="M12 12l8.73-5.04" /><Path d="M12 12L3.27 6.96" />
                    </Svg>
                  </View>
                  <Text style={styles.emptyTitle}>No active shipments</Text>
                  <Text style={styles.emptyDesc}>Start by sending your first parcel today!</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Explore Card */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Explore DropMate</Text>
          <TouchableOpacity style={styles.exploreCard} activeOpacity={0.9}>
            <LinearGradient
              colors={['#F8FAFC', '#F1F5F9']}
              style={styles.exploreGradient}
            >
              <View style={styles.exploreContent}>
                <Text style={styles.exploreTitle}>How it works?</Text>
                <Text style={styles.exploreDesc}>Learn how DropMate connects you with travelers for faster delivery.</Text>
                <View style={styles.exploreBtn}>
                  <Text style={styles.exploreBtnText}>Learn More</Text>
                </View>
              </View>
              <View style={styles.exploreIconBox}>
                <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
                </Svg>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const QuickAction = ({ title, subtitle, icon, color, iconColor, onPress }: any) => null;

const ActiveOrderCard = ({ id, status, from, to, time, color, onPress }: any) => {
  const displayStatus = status?.toUpperCase() === 'MATCHED' ? 'ACCEPTED' : status;
  const isAccepted = displayStatus?.toUpperCase() === 'ACCEPTED';

  return (
    <TouchableOpacity style={styles.activeOrderCard} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: color + '15', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          {isAccepted && (
            <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
          )}
          <Text style={[styles.statusText, { color }]}>{displayStatus}</Text>
        </View>
      </View>
      
      <View style={styles.routeContainer}>
        <View style={styles.routeIcons}>
          <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
          <View style={styles.routeLine} />
          <View style={[styles.routeDot, { borderColor: Colors.primary, borderWidth: 2, backgroundColor: '#FFF' }]} />
        </View>
        <View style={styles.routeTexts}>
          <Text style={styles.locationText} numberOfLines={1}>{from}</Text>
          <Text style={styles.locationText} numberOfLines={1}>{to}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTime}>{time}</Text>
        <View style={styles.footerAction}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2.5">
            <Path d="M5 12h14M12 5l7 7-7 7" />
          </Svg>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TripRecommendationCard = ({ name, from, to, date, capacity, onPress }: any) => (
  <TouchableOpacity style={styles.tripRecCard} activeOpacity={0.9} onPress={onPress}>
    <View style={styles.tripRecHeader}>
      <View style={styles.travelerAvatar}>
        <Text style={styles.avatarLetter}>{name?.charAt(0).toUpperCase()}</Text>
      </View>
      <View>
        <Text style={styles.travelerNameRec} numberOfLines={1}>{name}</Text>
        <Text style={styles.tripDateRec}>{date}</Text>
      </View>
    </View>
    <View style={styles.tripRecRoute}>
      <Text style={styles.tripRecLocation} numberOfLines={1}>{from}</Text>
      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
        <Path d="M5 12h14M12 5l7 7-7 7" />
      </Svg>
      <Text style={styles.tripRecLocation} numberOfLines={1}>{to}</Text>
    </View>
    <View style={styles.tripRecFooter}>
      <View style={styles.capacityBadgeRec}>
        <Text style={styles.capacityTextRec}>{capacity}kg Available</Text>
      </View>
    </View>
  </TouchableOpacity>
);

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
  if(name === 'truck') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="1" y="3" width="15" height="13" />
      <Path d="M16 8l4 0l3 3l0 5l-7 0" />
      <Circle cx="5.5" cy="18.5" r="2.5" />
      <Circle cx="18.5" cy="18.5" r="2.5" />
    </Svg>
  );
  if(name === 'user') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
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
    color: '#64748B',
    fontFamily: Typography.medium,
  },
  userName: {
    fontSize: 17,
    color: '#0F172A',
    fontFamily: Typography.bold,
    flexShrink: 1,
  },
  modeIndicator: {
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 4,
  },
  modeText: {
    fontSize: 10,
    color: '#059669',
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
    backgroundColor: '#F8FAFC',
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
    borderColor: '#FFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Typography.bold,
    
  },
  scrollContent: {
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#64748B',
    fontFamily: Typography.medium,
  },
  bannerSection: {
    marginVertical: 20,
  },
  customerHero: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  heroGradient: {
    padding: 24,
    paddingBottom: 30,
  },
  heroTitle: {
    fontSize: 32,
    color: '#FFF',
    fontFamily: Typography.bold,
    lineHeight: 40,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.medium,
  },
  customerActions: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    gap: 16,
    borderWidth:1,
    borderColor: '#d9e8f8ff',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#d9e8f8ff',
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  actionDesc: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.medium,
  },
  actionLabelDark: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  actionDescDark: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Typography.medium,
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 30,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  verificationIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 20,
    color: '#0F172A',
    fontFamily: Typography.bold,
    textAlign: 'center',
  },
  verificationDesc: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: Typography.medium,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  verificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369A1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  verificationBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusTextPending: {
    color: '#92400E',
    fontSize: 14,
    fontFamily: Typography.bold,
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
    marginBottom: 15,
  },
  bannerBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bannerBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: Typography.bold,
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
  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionHeader: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: Typography.bold,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionItem: {
    width: (width - 40 - 12) / 2,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Typography.medium,
    marginTop: 2,
  },
  verifyBanner: {
    marginHorizontal: 20,
    marginTop: 25,
    borderRadius: 20,
    overflow: 'hidden',
  },
  verifyGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  verifyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyTextContainer: {
    flex: 1,
  },
  verifyTitle: {
    fontSize: 14,
    color: '#9A3412',
    fontFamily: Typography.bold,
  },
  verifyDesc: {
    fontSize: 12,
    color: '#C2410C',
    fontFamily: Typography.medium,
  },
  horizontalScroll: {
    paddingRight: 20,
    gap: 15,
  },
  activeOrderCard: {
    width: width * 0.75,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
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
    color: '#64748B',
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
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  routeTexts: {
    flex: 1,
    gap: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Typography.semiBold,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  orderTime: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Typography.medium,
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingBox: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  exploreGradient: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exploreContent: {
    flex: 1,
  },
  exploreTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  exploreDesc: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.medium,
    marginTop: 4,
    marginBottom: 15,
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
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
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewDetailsText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: Typography.bold,
  },
  tripRecCard: {
    width: width * 0.6,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  tripRecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  travelerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Typography.bold,
  },
  travelerNameRec: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Typography.bold,
    width: width * 0.35,
  },
  tripDateRec: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Typography.medium,
  },
  tripRecRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tripRecLocation: {
    fontSize: 12,
    color: '#1E293B',
    fontFamily: Typography.semiBold,
    maxWidth: '40%',
  },
  tripRecFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityBadgeRec: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capacityTextRec: {
    fontSize: 10,
    color: '#15803D',
    fontFamily: Typography.bold,
  },
  emptyTripCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyTripText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.medium,
  }
});

export default CustomerHomeScreen;
