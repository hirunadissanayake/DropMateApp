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
    return (
      <TouchableOpacity 
        style={[styles.tripCard, item.isFull && styles.disabledCard]}
        onPress={() => !item.isFull && navigation.navigate('TripDetails', { tripId: item.id })}
        activeOpacity={item.isFull ? 1 : 0.9}
        disabled={item.isFull}
      >
        <View style={styles.cardHeader}>
          <View style={styles.travelerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{item.traveler?.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.travelerName} numberOfLines={1}>{item.traveler?.name}</Text>
            </View>
          </View>
          <View style={styles.badgeContainer}>
            {item.isRequested && (
              <View style={styles.requestedBadge}>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4">
                  <Path d="M20 6L9 17l-5-5" />
                </Svg>
                <Text style={styles.requestedText}>Requested</Text>
              </View>
            )}
            {item.isFull && (
              <View style={styles.fullBadge}>
                <Text style={styles.fullBadgeText}>Full</Text>
              </View>
            )}
            <View style={styles.capacityBadge}>
              <Text style={styles.capacityText}>{item.capacityKg ?? 0} kg max</Text>
            </View>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={styles.dot} />
            <Text style={styles.locationText} numberOfLines={1}>{item.fromLocation}</Text>
          </View>
          <View style={styles.line} />
          <View style={styles.routeRow}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <Circle cx="12" cy="10" r="3" />
            </Svg>
            <Text style={styles.locationText} numberOfLines={1}>{item.toLocation}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>
              {dayjs(item.travelDate).format('ddd, MMM DD')} • {item.travelTime || 'Flexible'}
            </Text>
          </View>
          <View style={[styles.viewBtn, item.isFull && styles.disabledBtn]}>
            <Text style={styles.viewBtnText}>{item.isFull ? 'No Space' : 'View Details'}</Text>
          </View>
        </View>
        {item.isFull && (
          <Text style={styles.fullNote}>This traveler has reached their weight limit for this trip.</Text>
        )}
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
  disabledCard: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
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
