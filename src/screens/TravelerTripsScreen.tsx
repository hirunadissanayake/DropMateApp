import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import * as tripService from '../services/tripService';
import Toast from 'react-native-toast-message';
import CustomAlert from '../components/common/CustomAlert';

const { width } = Dimensions.get('window');
const BRAND_GREEN = '#006C52';
const BRAND_LIGHT = '#DCFBEB';

const TravelerTripsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{title: string, message: string, confirmText: string, type?: 'error', action: () => void}>({
    title: '',
    message: '',
    confirmText: '',
    action: () => {}
  });

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

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchTrips();
      }
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  const handleCancelTrip = (tripId: string) => {
    setAlertConfig({
      title: 'Cancel Trip',
      message: 'Are you sure you want to cancel this trip?',
      confirmText: 'Yes, Cancel',
      type: 'error',
      action: async () => {
        setAlertVisible(false);
        try {
          setLoading(true);
          await tripService.cancelTrip(token!, tripId);
          Toast.show({ type: 'success', text1: 'Trip cancelled successfully' });
          fetchTrips();
        } catch (err: any) {
          setLoading(false);
          Toast.show({ type: 'error', text1: 'Failed', text2: err.message || 'Could not cancel trip' });
        }
      }
    });
    setAlertVisible(true);
  };

  const handleDeleteTrip = (tripId: string) => {
    setAlertConfig({
      title: 'Delete Trip',
      message: 'Are you sure you want to permanently delete this trip?',
      confirmText: 'Yes, Delete',
      type: 'error',
      action: async () => {
        setAlertVisible(false);
        try {
          setLoading(true);
          await tripService.deleteTrip(token!, tripId);
          Toast.show({ type: 'success', text1: 'Trip deleted successfully' });
          fetchTrips();
        } catch (err: any) {
          setLoading(false);
          Toast.show({ type: 'error', text1: 'Failed', text2: err.message || 'Could not delete trip' });
        }
      }
    });
    setAlertVisible(true);
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
                <Svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 6l6-4 6 4 6-4v14l-6 4-6-4-6 4z" />
                  <Path d="M9 2v14" />
                  <Path d="M15 6v14" />
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
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onCancel={() => handleCancelTrip(trip.id)} 
                onDelete={() => handleDeleteTrip(trip.id)} 
              />
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          cancelText="No, Keep It"
          type={alertConfig.type}
          onConfirm={alertConfig.action}
          onCancel={() => setAlertVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
};

const TripCard = ({ trip, onCancel, onDelete }: any) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const statusColor = trip.status === 'ACTIVE' ? '#059669' : trip.status === 'COMPLETED' ? '#2563EB' : '#DC2626';
  const date = new Date(trip.travelDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const canCancel = trip.status === 'ACTIVE' && (!trip.parcels || trip.parcels.length === 0) && (!trip.usedCapacity || trip.usedCapacity === 0);
  const canDelete = trip.status === 'CANCELLED';

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('TripDetails', { tripId: trip.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.routeRow}>
          <View style={styles.dotColumn}>
            <View style={styles.routeDotStart}>
              <View style={styles.routeDotInner} />
            </View>
            <View style={styles.dashedLine} />
            <View style={styles.routePinEnd}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="#DC2626" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <Circle cx="12" cy="10" r="3" fill="#FFFFFF" />
              </Svg>
            </View>
          </View>
          <View style={styles.locationColumn}>
            <Text style={styles.locationText}>{trip.fromLocation}</Text>
            <Text style={styles.locationText}>{trip.toLocation}</Text>
          </View>
        </View>
        <View style={styles.headerRightCol}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{trip.status}</Text>
          </View>
          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 6h18" />
                <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <Path d="M10 11v6" />
                <Path d="M14 11v6" />
              </Svg>
            </TouchableOpacity>
          )}
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
              <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </Svg>
            <Text style={styles.footerText}>{trip.capacityKg} kg</Text>
          </View>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>PARCELS</Text>
          <View style={styles.infoRow}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
              <Path d="M12 22.08V12" />
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
  routeDotStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  routeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  dashedLine: {
    width: 1,
    height: 30,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  locationColumn: {
    gap: 28,
    flex: 1,
  },
  routePinEnd: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerRightCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
    fontFamily: 'Manrope-Bold',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
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
    letterSpacing: 0.2,
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
