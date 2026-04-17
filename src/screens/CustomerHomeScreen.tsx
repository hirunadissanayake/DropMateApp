import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as authService from '../services/authService';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

const CustomerHomeScreen = ({ navigation }: any) => {
  const { user, token, setUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

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
    if (hour < 12) return 'Good Morning 👋';
    if (hour < 17) return 'Good Afternoon 👋';
    return 'Good Evening 👋';
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent={true} 
      />
      {/* Dynamic Background */}
      <View style={styles.bgContainer}>
        <LinearGradient
          colors={['#F0FFF8', '#FFFFFF']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.bgBlob} />
      </View>

      {/* Sticky Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerCard}>
          <TouchableOpacity 
            style={styles.userInfo} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarBorder}>
              {user?.selfieUrl ? (
                <Image 
                  source={{ uri: user.selfieUrl }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getInitial(user?.name || '')}</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#006C52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="#006C52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#006C52']} // Android
            tintColor="#006C52" // iOS
            progressViewOffset={Platform.OS === 'ios' ? 0 : 115}
          />
        }
      >
        <View style={styles.contentBody}>
          {/* Verification Status Banner - Only show if NOT approved */}
          {!user?.isCustomerApproved && (
            <View style={styles.statusCard}>
              <LinearGradient
                colors={['#006C52', '#004D3B']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.statusCardGradient}
              >
                <View style={styles.statusRow}>
                  <View style={styles.statusInfo}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>STATUS: REVIEWING</Text>
                    </View>
                    <Text style={styles.statusTitle}>Verification in Progress</Text>
                    {/* <Text style={styles.statusDesc}>Enjoy 15% off your first delivery once verified.</Text> */}
                  </View>
                  <View style={styles.shieldIcon}>
                    <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <Path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M9 12L11 14L15 10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Approved Content sections */}
          {user?.isCustomerApproved && (
            <>
              {/* Wallet Summary */}
              <View style={styles.walletCardApproved}>
                <LinearGradient
                  colors={['#006C52', '#004D3B']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.walletGradient}
                >
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletLabel}>Available Balance</Text>
                    <Text style={styles.walletAmount}>LKR 12,450.00</Text>
                  </View>
                  <TouchableOpacity style={styles.topUpBtn}>
                    <Text style={styles.topUpText}>Top Up</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Active Orders Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>ACTIVE SHIPMENTS</Text>
                  <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.horizontalScroll}
                >
                  <ActiveOrderCard 
                    id="#DM-9942" 
                    status="In Transit" 
                    location="Kandy to Colombo" 
                    time="ETA: 2 hrs"
                    icon="truck"
                    color="#006C52"
                  />
                  <ActiveOrderCard 
                    id="#DM-1024" 
                    status="Out for Delivery" 
                    location="Galle to Matara" 
                    time="ETA: 45 mins"
                    icon="package"
                    color="#0EA5E9"
                  />
                </ScrollView>
              </View>
            </>
          )}

          {/* Profile Progress - Only show if NOT approved */}
          {!user?.isCustomerApproved && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Profile Completion</Text>
                <Text style={styles.progressValue}>80%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '80%' }]} />
              </View>
              <Text style={styles.hintText}>💡 Tip: Add a backup phone for 100% security.</Text>
            </View>
          )}

          {/* Core Services Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OUR SERVICES</Text>
            <View style={styles.serviceRow}>
              <ServiceItem 
                title="Send Parcel" 
                icon="package"
                color="#E0F2FE"
                iconColor="#0369A1"
              />
              <ServiceItem 
                title="Track Order" 
                icon="map"
                color="#F0FDF4"
                iconColor="#15803D"
              />
              <ServiceItem 
                title="My Wallet" 
                icon="credit-card"
                color="#FFF7ED"
                iconColor="#C2410C"
              />
            </View>
          </View>

          {/* Insights / Explore Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPLORE DROPMATE</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.exploreFeatureCard}>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Instant Logistics</Text>
                <Text style={styles.featureSubtitle}>Learn how we deliver 3x faster than anyone else.</Text>
                <View style={styles.featureBtn}>
                  <Text style={styles.featureBtnText}>Read Guide</Text>
                </View>
              </View>
              <View style={styles.featureIconBox}>
                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#FBBF24" />
                </Svg>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const ActiveOrderCard = ({ id, status, location, time, icon, color }: any) => (
  <TouchableOpacity style={styles.activeOrderCard} activeOpacity={0.9}>
    <View style={styles.orderCardHeader}>
      <View style={[styles.orderIconBox, { backgroundColor: color + '15' }]}>
        {renderServiceIcon(icon, color)}
      </View>
      <View style={styles.statusChip}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusChipText, { color: color }]}>{status}</Text>
      </View>
    </View>
    <View style={styles.orderCardBody}>
      <Text style={styles.orderId}>{id}</Text>
      <Text style={styles.orderLocation}>{location}</Text>
    </View>
    <View style={styles.orderCardFooter}>
      <Text style={styles.orderTime}>{time}</Text>
      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 12h14M12 5l7 7-7 7" />
      </Svg>
    </View>
  </TouchableOpacity>
);

const ServiceItem = ({ title, icon, color, iconColor }: any) => (
  <TouchableOpacity style={styles.serviceBtn} activeOpacity={0.8}>
    <View style={[styles.serviceIconBox, { backgroundColor: color }]}>
       {renderServiceIcon(icon, iconColor)}
    </View>
    <Text style={styles.serviceLabel}>{title}</Text>
  </TouchableOpacity>
);

const renderServiceIcon = (name: string, color: string) => {
  const size = 24;
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
  if(name === 'credit-card') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <Path d="M1 10h22" />
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
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgBlob: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(0, 108, 82, 0.05)',
  },
  scrollContent: {
    flexGrow: 1,
    zIndex: 1,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : (StatusBar.currentHeight || 0) + 12,
  },
  headerCard: {
    marginTop: Platform.OS === 'ios' ? 44 : 0, // Offset for iOS status bar in translucent mode if not handled by SafeAreaView
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E7F5EF',
    padding: 2,
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#006C52',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    flex: 1,
    borderRadius: 22,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  greetingText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  userName: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentBody: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 140 : (StatusBar.currentHeight || 0) + 120,
  },
  statusCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  statusCardGradient: {
    padding: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  shieldIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 15,
    color: '#006C52',
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#006C52',
    borderRadius: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 12,
    color: '#006C52',
    fontWeight: '700',
  },
  horizontalScroll: {
    paddingRight: 20,
    gap: 16,
    marginBottom: 10,
  },
  walletCardApproved: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  walletGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  walletAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  topUpBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  topUpText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  activeOrderCard: {
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  orderCardBody: {
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  orderLocation: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  orderTime: {
    fontSize: 12,
    color: '#006C52',
    fontWeight: '700',
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  exploreFeatureCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF9F6',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  featureBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  featureBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  featureIconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomerHomeScreen;
