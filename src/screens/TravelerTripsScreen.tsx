import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import * as tripService from '../services/tripService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const BRAND_GREEN = '#006C52';
const BRAND_LIGHT = '#DCFBEB';

const TravelerTripsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    try {
      const data = await tripService.getMyTrips(token!);
      const sortedTrips = data.sort((a: any, b: any) => {
        // Sort by createdAt descending (newest first). Fallback to ID if needed.
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
        return timeB - timeA;
      });
      setTrips(sortedTrips);
    } catch (error: any) {
      console.error('Fetch trips error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch trips',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTrips();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#DCFBEB', '#F8FAFC', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Trips</Text>
            <Text style={styles.headerSubtitle}>Manage your upcoming travel routes</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateTrip' as any)}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 5V19M5 12H19" />
            </Svg>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={BRAND_GREEN} />
          </View>
        ) : trips.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyScroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_GREEN]} />}
          >
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </Svg>
                <View style={styles.emptyCircle} />
              </View>
              <Text style={styles.emptyTitle}>No trips found</Text>
              <Text style={styles.emptySubtitle}>You haven't added any travel trips yet. Create your first trip to start earning.</Text>
              <TouchableOpacity 
                style={styles.createNowButton}
                onPress={() => navigation.navigate('CreateTrip' as any)}
              >
                <Text style={styles.createNowText}>Create Now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_GREEN]} />}
          >
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

const TripCard = ({ trip }: any) => {
  const statusColor = trip.status === 'ACTIVE' ? '#059669' : trip.status === 'COMPLETED' ? '#2563EB' : '#DC2626';
  const date = new Date(trip.travelDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={styles.routeRow}>
          <View style={styles.dotColumn}>
            <View style={styles.dot} />
            <View style={styles.dashedLine} />
            <View style={[styles.dot, { backgroundColor: BRAND_GREEN }]} />
          </View>
          <View style={styles.locationColumn}>
            <Text style={styles.locationText}>{trip.fromLocation}</Text>
            <Text style={styles.locationText}>{trip.toLocation}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{trip.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>DATE</Text>
          <View style={styles.infoRow}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <Path d="M16 2v4M8 2v4M3 10h18"/>
            </Svg>
            <Text style={styles.footerText}>{date}</Text>
          </View>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>CAPACITY</Text>
          <View style={styles.infoRow}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </Svg>
            <Text style={styles.footerText}>{trip.capacityKg} kg</Text>
          </View>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>PARCELS</Text>
          <View style={styles.infoRow}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="10" />
              <Path d="M12 8v4l3 3" />
            </Svg>
            <Text style={styles.footerText}>{trip.parcels?.length || 0} Assigned</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyScroll: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BRAND_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: BRAND_LIGHT,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    fontFamily: 'Manrope-Bold',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: 'Manrope',
  },
  createNowButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: BRAND_GREEN,
  },
  createNowText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  routeRow: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  dotColumn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dashedLine: {
    width: 1,
    height: 40,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  locationColumn: {
    gap: 28,
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Manrope-Bold',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoCol: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    fontFamily: 'Manrope-Medium',
  },
});

export default TravelerTripsScreen;
