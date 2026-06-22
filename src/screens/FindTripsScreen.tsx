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
  Dimensions,
  Image,
  Animated,
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
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const { width } = Dimensions.get('window');

const SkeletonItem = ({ style }: { style?: any }) => {
  const { theme } = useTheme();
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
          borderRadius: style?.borderRadius || 8,
          opacity,
        },
      ]}
    />
  );
};

const TripTicketSkeleton = () => {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  return (
    <View style={s.premiumTicket}>
      <View style={s.ticketMainBody}>
        <View style={s.travelerHeader}>
          <View style={s.travelerProfile}>
            <SkeletonItem style={{ width: 48, height: 48, borderRadius: 24 }} />
            <View style={s.nameRatingRow}>
              <SkeletonItem style={{ width: 100, height: 16 }} />
              <SkeletonItem style={{ width: 40, height: 16 }} />
            </View>
          </View>
          <View style={s.capacityIndicator}>
            <SkeletonItem style={{ width: 60, height: 22 }} />
          </View>
        </View>

        <View style={s.routeSection}>
          <View style={s.routePoint}>
            <View style={s.routeIconCol}>
              <View style={[s.startRing, { borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]} />
              <View style={s.routeConnector} />
            </View>
            <View style={s.routeInfoCol}>
              <View style={{ gap: 4 }}>
                <SkeletonItem style={{ width: 40, height: 10 }} />
                <SkeletonItem style={{ width: 120, height: 16 }} />
              </View>
            </View>
          </View>

          <View style={s.routePoint}>
            <View style={s.routeIconCol}>
               <View style={{ marginTop: 4 }}>
                 <SkeletonItem style={{ width: 14, height: 14, borderRadius: 7 }} />
               </View>
            </View>
            <View style={s.routeInfoCol}>
              <View style={{ gap: 4 }}>
                <SkeletonItem style={{ width: 60, height: 10 }} />
                <SkeletonItem style={{ width: 140, height: 16 }} />
              </View>
            </View>
          </View>
        </View>

        <View style={s.ticketFooter}>
          <SkeletonItem style={{ width: 120, height: 14 }} />
          <SkeletonItem style={{ width: 100, height: 36, borderRadius: 12 }} />
        </View>
      </View>
    </View>
  );
};

const FindTripsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { token } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [availableFrom, setAvailableFrom] = useState<string[]>([]);
  const [availableTo, setAvailableTo] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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
    if (!fromLocation) {
      setTrips([]);
      setHasMore(false);
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      return;
    }

    if (pageNum === 1 && !isRefreshing) {
      setLoading(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }
    
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
      
      // Since backend filter might reduce results per page, we use empty array or hasMore from response if added
      // Or we can check if newTrips.length < limit. But let's check response.totalPages
      setHasMore(pageNum < response.totalPages);
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
    }, [token, fromLocation, toLocation])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(page); // keep page or reset? usually reset to 1
    onRefreshInternal();
  };

  const onRefreshInternal = () => {
    setPage(1);
    setHasMore(true);
    fetchTrips(1, true);
    fetchFilterCities();
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchTrips(page + 1);
  };

  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const s = makeStyles(theme);

  const renderTripItem = ({ item }: { item: any }) => {
    const isFull = item.isFull;
    
    return (
      <TouchableOpacity 
        style={[s.premiumTicket, isFull && s.disabledTicket]}
        onPress={() => !isFull && navigation.navigate('TripDetails', { tripId: item.id })}
        activeOpacity={isFull ? 1 : 0.85}
        disabled={isFull}
      >
        <View style={s.ticketMainBody}>
          <View style={s.travelerHeader}>
            <View style={s.travelerProfile}>
              <View style={s.avatarContainer}>
                {item.traveler?.selfieUrl ? (
                  <Image source={{ uri: item.traveler.selfieUrl }} style={s.premiumAvatarImg} />
                ) : (
                  <View style={s.initialsAvatar}>
                    <Text style={s.initialsText}>{item.traveler?.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={s.premiumVerifiedBadge}>
                  <Svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                    <Path d="M20 6L9 17l-5-5" />
                  </Svg>
                </View>
              </View>
              <View style={s.nameRatingRow}>
                <Text style={s.travelerNameText} numberOfLines={1}>{item.traveler?.name}</Text>
                {!!(item.traveler?.travelerRating && item.traveler.travelerRating > 0) && (
                  <View style={s.ratingBadge}>
                    <Svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B">
                      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                    </Svg>
                    <Text style={s.ratingValue}>{Number(item.traveler.travelerRating).toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={s.capacityIndicator}>
              <Text style={s.capacityWeight}>
                {item.usedCapacity > 0 ? `${item.capacityKg - item.usedCapacity}/${item.capacityKg}` : item.capacityKg} kg
              </Text>
              <Text style={s.capacityStatus}>Available</Text>
            </View>
          </View>

          <View style={s.routeSection}>
            <View style={s.routePoint}>
              <View style={s.routeIconCol}>
                <View style={s.startRing} />
                <View style={s.routeConnector} />
              </View>
              <View style={s.routeInfoCol}>
                <Text style={s.routeLabel}>PICKUP</Text>
                <Text style={s.routeCityName}>{item.fromLocation}</Text>
              </View>
              <View style={s.dateCol}>
                <Text style={s.routeDateText}>{dayjs(item.travelDate).format('MMM DD')}</Text>
              </View>
            </View>

            <View style={s.routePoint}>
              <View style={s.routeIconCol}>
                <View style={s.endPin}>
                   <Svg width="14" height="14" viewBox="0 0 24 24" fill="#EF4444">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <Circle cx="12" cy="10" r="3" fill="white" />
                  </Svg>
                </View>
              </View>
              <View style={s.routeInfoCol}>
                <Text style={s.routeLabelDest}>DESTINATION</Text>
                <Text style={s.routeCityName}>{item.toLocation}</Text>
              </View>
              <View style={s.dateCol}>
                <View style={s.vehicleTagMini}>
                  <Text style={s.vehicleTagText}>{item.vehicleType || 'Car'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={s.ticketFooter}>
            <Text style={s.arrivalInfo}>Departs: <Text style={s.arrivalValue}>{item.travelTime || 'Flexible'}</Text></Text>
            <TouchableOpacity 
              style={s.bookActionBtn}
              onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
            >
              <Text style={s.bookActionText}>View Details</Text>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.ticketNotchLeft} />
        <View style={s.ticketNotchRight} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Find Travelers</Text>
          <Text style={s.headerSubtitle}>Discover trips headed your way</Text>

          <View style={s.searchHeaderCard}>
            <View style={s.searchInputsRow}>
              <View style={{ flex: 1 }}>
                <CustomDropdown
                  options={availableFrom}
                  selectedOption={fromLocation}
                  onSelect={setFromLocation}
                  placeholder="From"
                  theme={theme}
                />
              </View>

              <TouchableOpacity style={s.horizontalSwapBtn} onPress={swapLocations}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M7 16V4M7 4L3 8M7 4L11 8" />
                  <Path d="M17 8v12M17 20l-4-4M17 20l4-4" />
                </Svg>
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <CustomDropdown
                  options={availableTo}
                  selectedOption={toLocation}
                  onSelect={setToLocation}
                  placeholder="To"
                  disabled={!fromLocation}
                  theme={theme}
                />
              </View>
            </View>

            {(fromLocation || toLocation) && (
              <TouchableOpacity style={s.clearAllBtn} onPress={() => { setFromLocation(''); setToLocation(''); }}>
                <Text style={s.clearAllText}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading && !refreshing ? (
          <FlatList
            data={[1, 2, 3]}
            renderItem={() => <TripTicketSkeleton />}
            keyExtractor={(i) => i.toString()}
            contentContainerStyle={s.listContent}
          />
        ) : (
          <FlatList
            data={trips}
            renderItem={renderTripItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={s.footerLoader}>
                  <ActivityIndicator color={theme.primary} />
                </View>
              ) : !hasMore && trips.length > 0 ? (
                <Text style={s.endText}>No more travelers available</Text>
              ) : <View style={{ height: 100 }} />
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
            }
            ListEmptyComponent={
              <View style={s.emptyContainer}>
                <View style={s.emptyIconBox}>
                  <Svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5">
                    <Path d="M3 6l6-4 6 4 6-4v14l-6 4-6-4-6 4z" />
                    <Path d="M9 2v14" />
                    <Path d="M15 6v14" />
                  </Svg>
                </View>
                <Text style={s.emptyTitle}>
                  {!fromLocation ? 'Select a Location' : 'No Trips Available'}
                </Text>
                <Text style={s.emptySubtitle}>
                  {!fromLocation 
                    ? 'Please select your starting location (From) to discover travelers heading your way.'
                    : 'There are currently no active trips matching your search. Check back later!'
                  }
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.text.secondary,
    marginTop: 4,
    fontFamily: Typography.regular,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 120,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  premiumTicket: {
    backgroundColor: theme.card,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.isDark ? 0.3 : 0.05,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'visible',
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
    backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9',
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
    backgroundColor: theme.primary,
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
    borderColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  travelerNameText: {
    fontSize: 16,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    maxWidth: width * 0.4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
  },
  ratingValue: {
    fontSize: 10,
    color: '#F59E0B',
    fontFamily: Typography.bold,
  },
  capacityIndicator: {
    alignItems: 'flex-end',
  },
  capacityWeight: {
    fontSize: 18,
    color: theme.primary,
    fontFamily: Typography.extraBold,
  },
  capacityStatus: {
    fontSize: 10,
    color: theme.text.tertiary,
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
    borderColor: theme.primary,
    backgroundColor: theme.card,
    marginTop: 4,
  },
  routeConnector: {
    flex: 1,
    width: 2,
    backgroundColor: theme.border,
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
    color: theme.text.tertiary,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  routeLabelDest: {
    fontSize: 9,
    color: theme.text.tertiary,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  routeCityName: {
    fontSize: 15,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginTop: -2,
  },
  dateCol: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  routeDateText: {
    fontSize: 12,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  vehicleTagMini: {
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleTagText: {
    fontSize: 10,
    color: theme.isDark ? theme.primary : '#475569',
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
    borderTopColor: theme.border,
    borderStyle: 'dashed',
  },
  arrivalInfo: {
    fontSize: 13,
    color: theme.text.secondary,
    fontFamily: Typography.regular,
  },
  arrivalValue: {
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  bookActionBtn: {
    backgroundColor: theme.primary,
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
    backgroundColor: theme.background,
  },
  ticketNotchRight: {
    position: 'absolute',
    right: -10,
    top: '65%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.05)' : '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    color: theme.text.primary,
    marginBottom: 8,
    fontFamily: Typography.bold,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: Typography.regular,
    lineHeight: 22,
  },
  searchHeaderCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 16,
    marginTop: 20,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.isDark ? 0.3 : 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  horizontalSwapBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#F0FDF4',
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllBtn: {
    marginTop: 12,
    alignSelf: 'center',
  },
  clearAllText: {
    fontSize: 12,
    color: theme.primary,
    fontFamily: Typography.bold,
    textDecorationLine: 'underline',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endText: {
    textAlign: 'center',
    color: theme.text.tertiary,
    fontSize: 14,
    paddingVertical: 20,
    fontFamily: Typography.medium,
  },
});

export default FindTripsScreen;
