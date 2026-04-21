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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect, G, Defs, ClipPath, Circle } from 'react-native-svg';
import * as authService from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Typography } from '../constants/Typography';

const { width } = Dimensions.get('window');

const banners = [
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
  }
];

const extendedBanners = [...banners, { ...banners[0], id: 'clone-1' }];


const TravelerHomeScreen = ({ navigation }: any) => {
  const { user, token, setUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
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

      if (nextIndex === banners.length) {
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: 0, animated: false });
          }
          currentIndexRef.current = 0;
        }, 500);
      }
    }, 4000); // 4 seconds auto-scroll interval

    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const userData = await authService.getMe(token);
      setUser(userData);
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Clean Header - Different from Customer */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.userInfoRow} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('TravelerProfile')}
        >
          <View style={styles.avatarBorder}>
            {user?.selfieUrl ? (
              <Image 
                source={{ uri: user.selfieUrl }} 
                style={styles.avatarImage} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={styles.greetingTextContainer}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.userNameText}>Hi, {userName}</Text>
              <View style={styles.modeIndicator}>
                <View style={styles.activeDot} />
                <Text style={styles.modeText}>Traveler Mode</Text>
              </View>
            </View>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#052017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="#052017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#006C52']}
            tintColor="#006C52"
          />
        }
      >
        {/* Banner Slider */}
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
            onMomentumScrollEnd={(event: any) => {
              const x = event.nativeEvent.contentOffset.x;
              let index = Math.round(x / width);
              if (index === banners.length) {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ x: 0, animated: false });
                }
                index = 0;
              }
              currentIndexRef.current = index;
            }}
            scrollEventThrottle={16}
          >
            {extendedBanners.map((banner, index) => (
              <View key={banner.id} style={styles.bannerWrapper}>
                <LinearGradient
                  colors={banner.bgColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bannerContainer}
                >
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerDesc}>{banner.desc}</Text>
                  </View>
                  <View style={styles.bannerIconOverlay}>
                    <Svg width="120" height="120" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.1, transform: [{ rotate: '-15deg' }, { scale: 1.5 }] }}>
                      <Path d="M5 12h14M12 5l7 7-7 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </Animated.ScrollView>
          
          {/* Dot Indicators */}
          <View style={styles.dotsContainer}>
            {banners.map((_, i) => {
              const inputRange = i === 0 
                ? [-width, 0, width, (banners.length - 1) * width, banners.length * width, (banners.length + 1) * width]
                : [(i - 1) * width, i * width, (i + 1) * width];
                
              const outputWidth = i === 0
                ? [8, 24, 8, 8, 24, 8]
                : [8, 24, 8];
                
              const outputOpacity = i === 0
                ? [0.3, 1, 0.3, 0.3, 1, 0.3]
                : [0.3, 1, 0.3];
                
              const outputBg = i === 0
                ? ['#D1D5DB', '#006C52', '#D1D5DB', '#D1D5DB', '#006C52', '#D1D5DB']
                : ['#D1D5DB', '#006C52', '#D1D5DB'];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: outputWidth,
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: outputOpacity,
                extrapolate: 'clamp',
              });
              
              return (
                <Animated.View
                  key={i.toString()}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity,
                      backgroundColor: scrollX.interpolate({
                        inputRange,
                        outputRange: outputBg,
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Action / Review Cards */}
        <View style={styles.cardsSection}>
          <Text style={styles.sectionHeader}>Action Required</Text>
          
          {/* Under Review Card - Only show if not approved */}
          {!user?.isTravelerApproved && (
            <View style={styles.reviewCard}>
              <View style={styles.reviewCardContent}>
                <View style={styles.reviewIconContainer}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                     <Path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="#00513D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <View style={styles.reviewTextContent}>
                  <Text style={styles.reviewTitleDark}>Verification in Progress</Text>
                  <Text style={styles.reviewDescDark}>
                    Validating your documents. Takes 24-48 hours.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Dashboard Grid / Locked Services */}
        <View style={styles.dashboardSection}>
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionHeader}>Traveler Dashboard</Text>
             <TouchableOpacity><Text style={styles.viewAllText}>View all</Text></TouchableOpacity>
          </View>
          
          <View style={styles.gridContainer}>
            {/* Available Routes */}
            <TouchableOpacity 
              style={styles.gridCard}
              activeOpacity={0.8}
            >
              <View style={styles.gridIconHeader}>
                <View style={styles.gridIconBox}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00513D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                    <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </Svg>
                </View>
              </View>
              <Text style={styles.gridTitle}>Help Center</Text>
              <Text style={styles.gridDesc}>Get support & FAQs.</Text>
            </TouchableOpacity>

            {/* Earnings */}
            {/* <View style={styles.gridCard}>
              <View style={styles.gridIconHeader}>
                <View style={styles.gridIconBox}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00513D" strokeWidth="2"><Path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/></Svg>
                </View>
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>LOCKED</Text>
                </View>
              </View>
              <Text style={styles.gridTitle}>Earnings</Text>
              <Text style={styles.gridDesc}>Track your courier revenue.</Text>
            </View> */}

            {/* Wallet */}
            <TouchableOpacity 
              style={styles.gridCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile' as any)}
            >
              <View style={styles.gridIconHeader}>
                <View style={styles.gridIconBox}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00513D" strokeWidth="2"><Path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round"/></Svg>
                </View>
              </View>
              <Text style={styles.gridTitle}>Profile</Text>
              <Text style={styles.gridDesc}>Manage your Profile.</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips for Travelers */}
        <View style={styles.tipsSection}>
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionHeader}>Traveler Tips</Text>
             <TouchableOpacity><Text style={styles.viewAllText}>View all</Text></TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 16, paddingRight: 24}}>
            <View style={styles.tipCard}>
              <View style={styles.tipImagePlaceholder}>
                 <LinearGradient colors={['#E2F3ED', '#C3E8DA']} style={StyleSheet.absoluteFillObject} />
                 <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00513D" strokeWidth="2" style={{opacity: 0.5}}>
                    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
                 </Svg>
                 <View style={styles.tipBadge}>
                    <Text style={styles.tipBadgeText}>Efficiency</Text>
                 </View>
              </View>
              <View style={styles.tipContent}>
                 <Text style={styles.tipTitle}>Maximize Earnings</Text>
                 <Text style={styles.tipSubtitle}>Batch multiple deliveries</Text>
              </View>
            </View>

            <View style={styles.tipCard}>
              <View style={styles.tipImagePlaceholder}>
                 <LinearGradient colors={['#E6E6FA', '#D8BFD8']} style={StyleSheet.absoluteFillObject} />
                 <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4A0E4E" strokeWidth="2" style={{opacity: 0.5}}>
                    <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" strokeLinecap="round" strokeLinejoin="round"/>
                 </Svg>
                 <View style={styles.tipBadge}>
                    <Text style={styles.tipBadgeText}>Quality</Text>
                 </View>
              </View>
              <View style={styles.tipContent}>
                 <Text style={styles.tipTitle}>Maintain 5-Stars</Text>
                 <Text style={styles.tipSubtitle}>Get priority access</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={{ height: 100 }} /> 
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FAFAFA',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7F5EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    backgroundColor: '#C3E8DA',
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
    color: '#00513D',
    fontFamily: Typography.bold,
    fontSize: 18,
  },
  greetingTextContainer: {
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: Typography.bold,
    letterSpacing: -0.5,
  },
  greetingText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: Typography.medium,
  },
  modeIndicator: {
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
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
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
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
  bannerContainer: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 24,
    justifyContent: 'center',
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
    marginTop: 16,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 24,
  },
  sectionHeader: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  viewAllText: {
    color: '#006C52',
    fontFamily: Typography.medium,
    fontSize: 14,
  },
  cardsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
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
    backgroundColor: '#E7F5EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewTextContent: {
    flex: 1,
  },
  reviewTitleDark: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  reviewDescDark: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.medium,
    lineHeight: 18,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileTitleDark: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  profilePercent: {
    fontSize: 15,
    color: '#006C52',
    fontFamily: Typography.bold,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#006C52',
    borderRadius: 4,
  },
  dashboardSection: {
    paddingLeft: 24,
    marginBottom: 32,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingRight: 24,
  },
  gridCard: {
    width: (width - 48 - 16) / 2,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lockedBadgeText: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: Typography.bold,
  },
  gridTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  gridDesc: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Typography.medium,
    lineHeight: 16,
  },
  tipsSection: {
    paddingLeft: 24,
  },
  tipCard: {
    width: width * 0.6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  tipImagePlaceholder: {
    height: 120,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tipBadgeText: {
    fontSize: 10,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  tipContent: {
    padding: 16,
  },
  tipTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  tipSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.medium,
  },
});

export default TravelerHomeScreen;

