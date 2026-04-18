import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import Svg, {Path, Circle, Rect, Line} from 'react-native-svg';
import BackButton from '../components/common/BackButton';
import {useAuthStore} from '../store/authStore';
import * as tripService from '../services/tripService';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';

const {width} = Dimensions.get('window');

const TripDetailsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();
  const {tripId} = route.params;
  const {token} = useAuthStore();

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [tripId]);

  const fetchDetails = async () => {
    try {
      const data = await tripService.getTripDetails(token!, tripId);
      setTrip(data);
    } catch (error) {
      console.error('Fetch details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBg = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#FEF3C7';
      case 'ACTIVE':
        return '#D1FAE5';
      case 'COMPLETED':
        return '#DBEAFE';
      case 'CANCELLED':
        return '#FEE2E2';
      case 'IN_TRANSIT':
        return '#DBEAFE';
      default:
        return '#F1F5F9';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#D97706';
      case 'ACTIVE':
        return '#059669';
      case 'COMPLETED':
        return '#2563EB';
      case 'CANCELLED':
        return '#DC2626';
      case 'IN_TRANSIT':
        return '#2563EB';
      default:
        return '#475569';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006C52" />
      </View>
    );
  }

  if (!trip) return null;

  const usedCap = trip.usedCapacity || 0;
  const totalCap = trip.capacityKg || 1;
  const capPercentage = Math.min((usedCap / totalCap) * 100, 100);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.premiumHeader}>
        <LinearGradient
          colors={['#004D3A', '#006C52', '#008C69']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={StyleSheet.absoluteFillObject}
        />
        <Svg
          width="200"
          height="200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="0.5"
          style={styles.bgGraphic1}>
          <Circle cx="12" cy="12" r="10" />
          <Circle cx="12" cy="12" r="6" />
          <Circle cx="12" cy="12" r="2" />
        </Svg>

        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerTop}>
            <BackButton onPress={() => navigation.goBack()} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Trip Details</Text>
            <View style={{width: 44}} />
          </View>

          <View style={styles.tripMetaRow}>
            <View>
              <Text style={styles.tripIdLabel}>TRIP REFERENCE</Text>
              <Text style={styles.tripIdValue}>
                #{trip.id.substring(0, 8).toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.statusPill,
                {backgroundColor: getStatusBg(trip.status)},
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {color: getStatusColor(trip.status)},
                ]}>
                {trip.status}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.floatingRouteCard}>
          <Text style={styles.sectionLabel}>YOUR TRAVEL ROUTE</Text>
          <View style={styles.routeBox}>
            <View style={styles.routeVisualCol}>
              <View style={styles.routeDotStart}>
                <View style={styles.routeDotInner} />
              </View>
              <View style={styles.routeDashedLine} />
              <View style={styles.routePinEnd}>
                <Svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="#DC2626"
                  stroke="#DC2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <Circle cx="12" cy="10" r="3" fill="#FFFFFF" />
                </Svg>
              </View>
            </View>
            <View style={styles.routeTextCol}>
              <View style={styles.routeLocationBox}>
                <Text style={styles.locSubtitle}>PICKUP LOCATION</Text>
                <Text style={styles.locTitle}>{trip.fromLocation}</Text>
              </View>
              <View style={[styles.routeLocationBox, {marginTop: 24}]}>
                <Text style={styles.locSubtitle}>DROPOFF DESTINATION</Text>
                <Text style={styles.locTitle}>{trip.toLocation}</Text>
              </View>
            </View>
          </View>
        </View>

        {!!trip.exactLocation && (
          <View style={[styles.infoBlock, styles.meetingPointCard]}>
            <Text style={styles.sectionLabel}>EXACT MEETING POINT</Text>
            <Text style={styles.meetingPointText}>{trip.exactLocation}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <Svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <Line x1="16" y1="2" x2="16" y2="6" />
                <Line x1="8" y1="2" x2="8" y2="6" />
                <Line x1="3" y1="10" x2="21" y2="10" />
              </Svg>
            </View>
            <Text style={styles.statLabel}>DATE</Text>
            <Text style={styles.statValue}>
              {dayjs(trip.travelDate).format('MMM DD')}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, {backgroundColor: '#F3E8FF'}]}>
              <Svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9333EA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
            </View>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={styles.statValue}>{trip.travelTime || 'Anytime'}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, {backgroundColor: '#FEF3C7'}]}>
              <Svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D97706"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </Svg>
            </View>
            <Text style={styles.statLabel}>LIMIT</Text>
            <Text style={styles.statValue}>{trip.capacityKg} kg</Text>
          </View>
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionLabel}>CAPACITY USAGE</Text>
            <Text style={styles.progressText}>
              {usedCap} / {totalCap} kg
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, {width: `${capPercentage}%`}]}
            />
          </View>
          <Text style={styles.availText}>
            {totalCap - usedCap} kg remaining for new parcels
          </Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.sectionLabel}>
            ASSIGNED PARCELS ({trip.parcels?.length || 0})
          </Text>
          {trip.parcels && trip.parcels.length > 0 ? (
            trip.parcels.map((parcel: any, idx: number) => (
              <TouchableOpacity
                key={parcel.id}
                activeOpacity={0.7}
                style={[
                  styles.parcelRow,
                  idx !== trip.parcels.length - 1 && styles.borderBottom,
                ]}>
                <View style={styles.parcelIconBox}>
                  <Svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#006C52"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
                    <Path d="M12 22.08V12" />
                  </Svg>
                </View>
                <View style={styles.parcelInfo}>
                  <Text style={styles.parcelName} numberOfLines={1}>
                    {parcel.name}
                  </Text>
                  <Text style={styles.parcelMeta}>
                    {parcel.weight} kg • {parcel.fromLocation} to{' '}
                    {parcel.toLocation}
                  </Text>
                </View>
                <View style={styles.parcelArrow}>
                  <Svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round">
                <Circle cx="12" cy="12" r="10" />
                <Line x1="12" y1="8" x2="12" y2="12" />
                <Line x1="12" y1="16" x2="12.01" y2="16" />
              </Svg>
              <Text style={styles.emptyParcelsText}>
                No parcels assigned yet.{'\n'}When customers book you, they'll
                appear here.
              </Text>
            </View>
          )}
        </View>

        {!!trip.note && (
          <View style={[styles.infoBlock, styles.noteCard]}>
            <Text style={styles.sectionLabel}>SPECIAL NOTE</Text>
            <Text style={styles.noteText}>"{trip.note}"</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F1F5F9'},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  premiumHeader: {
    height: 200,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGraphic1: {
    position: 'absolute',
    right: -60,
    top: -20,
    transform: [{scale: 1.5}],
  },
  headerSafeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 28,
    marginTop: 30,
  },
  tripIdLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: 'Manrope-Medium',
  },
  tripIdValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-ExtraBold',
  },
  statusPill: {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20},
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: 'Manrope-Bold',
  },

  scrollContent: {paddingBottom: 40, paddingHorizontal: 20},
  floatingRouteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    shadowColor: '#006C52',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.2,
    marginBottom: 16,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  routeBox: {flexDirection: 'row'},
  routeVisualCol: {width: 20, alignItems: 'center', paddingVertical: 6},
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
  routeDashedLine: {
    width: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  routePinEnd: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  routeTextCol: {flex: 1, marginLeft: 16},
  routeLocationBox: {},
  locSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 4,
    fontFamily: 'Manrope-Medium',
  },
  locTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: 'Manrope-Bold',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Manrope-Bold',
    textAlign: 'center',
  },

  infoBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006C52',
    fontFamily: 'Manrope-Bold',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#006C52',
    borderRadius: 4,
  },
  availText: {fontSize: 12, color: '#64748B', fontFamily: 'Manrope-Medium'},

  emptyState: {paddingVertical: 20, alignItems: 'center'},
  emptyParcelsText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    fontFamily: 'Manrope-Medium',
  },

  parcelRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 16},
  borderBottom: {borderBottomWidth: 1, borderBottomColor: '#F8FAFC'},
  parcelIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  parcelInfo: {flex: 1},
  parcelName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    marginBottom: 4,
  },
  parcelMeta: {fontSize: 13, color: '#64748B', fontFamily: 'Manrope-Medium'},
  parcelArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  meetingPointCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  meetingPointText: {
    fontSize: 15,
    color: '#0F172A',
    lineHeight: 24,
    fontFamily: 'Manrope-Bold',
  },

  noteCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#065F46',
    lineHeight: 24,
    fontFamily: 'Manrope-Medium',
  },
});

export default TripDetailsScreen;
