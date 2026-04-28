import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import * as tripService from '../services/tripService';
import Svg, { Path, Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import { Typography } from '../constants/Typography';
import CustomDropdown from '../components/common/CustomDropdown';

const { width } = Dimensions.get('window');

const FindTripsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token, user } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [availableFrom, setAvailableFrom] = useState<string[]>([]);
  const [availableTo, setAvailableTo] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchFilterCities = async () => {
    try {
      const froms = await tripService.getFromLocations(token!);
      setAvailableFrom(froms);
      
      const tos = await tripService.getToLocations(token!, fromLocation);
      setAvailableTo(tos);
    } catch (error) {
      console.error('Fetch filter cities error:', error);
    }
  };

  const fetchTrips = async (pageNum = 1, isRefreshing = false) => {
    if (pageNum > 1) setLoadingMore(true);
    
    try {
      const response = await tripService.getActiveTrips(token!, {
        page: pageNum,
        limit: 10,
        fromLocation: fromLocation || undefined,
        toLocation: toLocation || undefined
      });

      const newTrips = response.trips;
      
      if (pageNum === 1) {
        setTrips(newTrips);
      } else {
        setTrips(prev => [...prev, ...newTrips]);
      }
      
      setTotalPages(response.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Fetch active trips error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFilterCities();
      fetchTrips(1);
    }, [token])
  );

  useEffect(() => {
    fetchTrips(1);
    // Refresh 'To' list when 'From' changes to show valid routes
    const refreshTos = async () => {
      try {
        const tos = await tripService.getToLocations(token!, fromLocation);
        setAvailableTo(tos);
      } catch (e) {}
    };
    refreshTos();
  }, [fromLocation]);

  useEffect(() => {
    fetchTrips(1);
  }, [toLocation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips(1, true);
    fetchFilterCities();
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchTrips(page + 1);
    }
  };

  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const renderTripItem = ({ item }: { item: any }) => {
    const isFull = item.isFull;
    const rating = item.traveler?.rating || 0;
    
    return (
      <TouchableOpacity 
        style={[styles.premiumTicket, isFull && styles.disabledTicket]}
        onPress={() => !isFull && navigation.navigate('TripDetails', { tripId: item.id })}
        activeOpacity={isFull ? 1 : 0.85}
        disabled={isFull}
      >
        <View style={styles.ticketMainBody}>
          <View style={styles.travelerHeader}>
            <View style={styles.travelerProfile}>
              <View style={styles.avatarContainer}>
                {item.traveler?.selfieUrl ? (
                  <Image source={{ uri: item.traveler.selfieUrl }} style={styles.premiumAvatarImg} />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>{item.traveler?.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.premiumVerifiedBadge}>
                  <Svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                    <Path d="M20 6L9 17l-5-5" />
                  </Svg>
                </View>
              </View>
              <View>
                <Text style={styles.travelerNameText}>{item.traveler?.name}</Text>
                {/* <View style={styles.ratingBadge}>
                  <Svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B">
                    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                  </Svg>
                  <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
                </View> */}
              </View>
            </View>
            <View style={styles.capacityIndicator}>
              <Text style={styles.capacityWeight}>{item.capacityKg} kg</Text>
              <Text style={styles.capacityStatus}>Available</Text>
            </View>
          </View>

          <View style={styles.routeSection}>
            <View style={styles.routePoint}>
              <View style={styles.routeIconCol}>
                <View style={styles.startRing} />
                <View style={styles.routeConnector} />
              </View>
              <View style={styles.routeInfoCol}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeCityName}>{item.fromLocation}</Text>
              </View>
              <View style={styles.dateCol}>
                <Text style={styles.routeDateText}>{dayjs(item.travelDate).format('MMM DD')}</Text>
              </View>
            </View>

            <View style={styles.routePoint}>
              <View style={styles.routeIconCol}>
                <View style={styles.endPin}>
                   <Svg width="14" height="14" viewBox="0 0 24 24" fill="#EF4444">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <Circle cx="12" cy="10" r="3" fill="white" />
                  </Svg>
                </View>
              </View>
              <View style={styles.routeInfoCol}>
                <Text style={styles.routeLabelDest}>DESTINATION</Text>
                <Text style={styles.routeCityName}>{item.toLocation}</Text>
              </View>
              <View style={styles.dateCol}>
                <View style={styles.vehicleTagMini}>
                  <Text style={styles.vehicleTagText}>{item.vehicleType || 'Car'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <Text style={styles.arrivalInfo}>Departs: <Text style={styles.arrivalValue}>{item.travelTime || 'Flexible'}</Text></Text>
            <TouchableOpacity 
              style={styles.bookActionBtn}
              onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
            >
              <Text style={styles.bookActionText}>View Details</Text>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notches for Ticket Effect */}
        <View style={styles.ticketNotchLeft} />
        <View style={styles.ticketNotchRight} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find Travelers</Text>
          <Text style={styles.headerSubtitle}>Discover trips headed your way</Text>

          <View style={styles.searchHeaderCard}>
            <View style={styles.searchInputsCol}>
              <CustomDropdown
                options={availableFrom}
                selectedOption={fromLocation}
                onSelect={setFromLocation}
                placeholder="From"
              />
              <View style={styles.searchDivider}>
                <View style={styles.dividerLine} />
                <TouchableOpacity style={styles.swapBtn} onPress={swapLocations}>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M7 10l5-5 5 5" />
                    <Path d="M17 14l-5 5-5-5" />
                  </Svg>
                </TouchableOpacity>
                <View style={styles.dividerLine} />
              </View>
              <CustomDropdown
                options={availableTo}
                selectedOption={toLocation}
                onSelect={setToLocation}
                placeholder="To"
                disabled={!fromLocation}
              />
            </View>

            {(fromLocation || toLocation) && (
              <TouchableOpacity style={styles.clearAllBtn} onPress={() => { setFromLocation(''); setToLocation(''); }}>
                <Text style={styles.clearAllText}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#006C52" />
          </View>
        ) : (
          <FlatList
            data={trips}
            renderItem={renderTripItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator color="#006C52" />
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006C52']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5">
                    <Path d="M3 6l6-4 6 4 6-4v14l-6 4-6-4-6 4z" />
                    <Path d="M9 2v14" />
                    <Path d="M15 6v14" />
                  </Svg>
                </View>
                <Text style={styles.emptyTitle}>No Trips Available</Text>
                <Text style={styles.emptySubtitle}>
                  There are currently no active trips matching your search. Check back later!
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    color: '#0F172A',
    fontFamily: Typography.extraBold,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Typography.regular,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  travelerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    color: '#006C52',
    fontFamily: Typography.bold,
  },
  travelerName: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.medium,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontFamily: Typography.medium,
  },
  capacityBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  capacityText: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    fontFamily: Typography.bold,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    maxWidth: '50%',
  },
  requestedBadge: {
    backgroundColor: '#006C52',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
  },
  routeContainer: {
    marginBottom: 20,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#006C52',
    backgroundColor: '#FFFFFF',
  },
  line: {
    width: 2,
    height: 16,
    backgroundColor: '#F1F5F9',
    marginLeft: 6,
    marginVertical: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontFamily: Typography.bold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.medium,
  },
  viewBtn: {
    backgroundColor: '#006C52',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Typography.bold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#0F172A',
    marginBottom: 8,
    fontFamily: Typography.bold,
  },
  searchHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginTop: 20,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInputsCol: {
    gap: 0,
  },
  searchDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    marginVertical: -5,
    zIndex: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  swapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  clearAllBtn: {
    marginTop: 12,
    alignSelf: 'center',
  },
  clearAllText: {
    fontSize: 12,
    color: '#006C52',
    fontFamily: Typography.bold,
    textDecorationLine: 'underline',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: Typography.regular,
    lineHeight: 22,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  premiumTicket: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'visible', // Ensure notches are visible
  },
  disabledTicket: {
    opacity: 0.6,
  },
  ticketMainBody: {
    padding: 16,
  },
  travelerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  travelerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  initialsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#006C52',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: Typography.bold,
  },
  premiumVerifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelerNameText: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  ratingNumber: {
    fontSize: 11,
    color: '#D97706',
    fontFamily: Typography.bold,
  },
  capacityIndicator: {
    alignItems: 'flex-end',
  },
  capacityWeight: {
    fontSize: 18,
    color: '#006C52',
    fontFamily: Typography.extraBold,
  },
  capacityStatus: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: Typography.medium,
    textTransform: 'uppercase',
  },
  routeSection: {
    paddingLeft: 4,
    gap: 0,
  },
  routePoint: {
    flexDirection: 'row',
    minHeight: 50,
  },
  routeIconCol: {
    width: 30,
    alignItems: 'center',
  },
  startRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: '#006C52',
    backgroundColor: '#FFF',
    marginTop: 4,
  },
  routeConnector: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  endPin: {
    marginTop: 2,
  },
  routeInfoCol: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  routeLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  routeLabelDest: {
    fontSize: 9,
    color: '#EF4444',
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  routeCityName: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginTop: -2,
  },
  dateCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  routeDateText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  vehicleTagMini: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleTagText: {
    fontSize: 10,
    color: '#475569',
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  arrivalInfo: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.regular,
  },
  arrivalValue: {
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  bookActionBtn: {
    backgroundColor: '#006C52',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  bookActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Typography.bold,
  },
  ticketNotchLeft: {
    position: 'absolute',
    left: -10,
    top: '65%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC', // Background color of the screen
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ticketNotchRight: {
    position: 'absolute',
    right: -10,
    top: '65%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC', // Background color of the screen
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  fullBadge: {
    backgroundColor: '#64748B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fullBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    textTransform: 'uppercase',
    fontFamily: Typography.bold,
  },
  disabledBtn: {
    backgroundColor: '#94A3B8',
  },
  fullNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: Typography.regular,
  },
});

export default FindTripsScreen;
