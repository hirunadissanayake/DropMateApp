import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import * as parcelService from '../services/parcelService';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const FindParcelsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token } = useAuthStore();
  
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParcels = async () => {
    try {
      const data = await parcelService.getAllActiveParcels(token!);
      setParcels(data);
    } catch (error) {
      console.error('Fetch active parcels error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParcels();
  }, []);

  const renderParcelItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.parcelCard}
      onPress={() => navigation.navigate('ParcelDetails', { parcelId: item.id })}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        {item.imageUrls && item.imageUrls.length > 0 ? (
          <Image source={{ uri: item.imageUrls[0] }} style={styles.parcelImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
              <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" />
            </Svg>
          </View>
        )}
        <View style={styles.payoutBadge}>
          <Text style={styles.payoutText}>Earn LKR {item.travelerPayout?.toLocaleString()}</Text>
        </View>
        {item.isRequested && (
          <View style={styles.requestedBadge}>
             <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                <Path d="M20 6L9 17l-5-5" />
             </Svg>
             <Text style={styles.requestedText}>Requested</Text>
          </View>
        )}
      </View>
      
      <View style={styles.parcelInfo}>
        <View style={styles.rowBetween}>
          <Text style={styles.parcelName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.weightBadge}>
            <Text style={styles.weightText}>{item.weight} Kg</Text>
          </View>
        </View>
        
        <View style={styles.routeContainer}>
          <View style={styles.routeIcon}>
            <View style={styles.routeDot} />
            <View style={styles.routeLine} />
            <View style={[styles.routeDot, { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#006C52' }]} />
          </View>
          <View style={styles.routeTexts}>
            <Text style={styles.locationText}>{item.fromLocation}</Text>
            <Text style={[styles.locationText, { marginTop: 4 }]}>{item.toLocation}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.senderInfo}>
             <View style={styles.senderAvatar}>
                <Text style={styles.avatarLetter}>{item.sender?.name?.charAt(0).toUpperCase()}</Text>
             </View>
             <View>
                <Text style={styles.senderName}>{item.sender?.name}</Text>
                <View style={styles.ratingRow}>
                   <Svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B">
                      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                   </Svg>
                   <Text style={styles.ratingText}>{item.sender?.rating || 'New'}</Text>
                </View>
             </View>
          </View>
          <View style={styles.viewBtn}>
             <Text style={styles.viewBtnText}>View Details</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Available for Courier</Text>
            <Text style={styles.headerTitle}>Find Parcels</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
             <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2">
                <Path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />
             </Svg>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#006C52" />
        </View>
      ) : parcels.length === 0 ? (
        <View style={styles.emptyContainer}>
           <View style={styles.emptyIconBox}>
              <Svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1">
                 <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" />
                 <Path d="M3 8L12 13L21 8" />
                 <Path d="M12 21V13" />
              </Svg>
           </View>
           <Text style={styles.emptyTitle}>No Active Parcels</Text>
           <Text style={styles.emptyDesc}>There are currently no parcels waiting to be shipped. Check back later!</Text>
           <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
           </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={parcels}
          renderItem={renderParcelItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006C52']} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSafeArea: {
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Manrope-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Manrope-ExtraBold',
    marginTop: 4,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  parcelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    backgroundColor: '#F1F5F9',
  },
  parcelImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 108, 82, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  payoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope-Bold',
  },
  requestedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#006C52',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Manrope-Bold',
    textTransform: 'uppercase',
  },
  parcelInfo: {
    padding: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parcelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Manrope-Bold',
    flex: 1,
    marginRight: 10,
  },
  weightBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weightText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  routeIcon: {
    width: 20,
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006C52',
  },
  routeLine: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  routeTexts: {
    flex: 1,
    marginLeft: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    fontFamily: 'Manrope-SemiBold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E7F5EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#006C52',
    fontWeight: '700',
    fontSize: 14,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  viewBtn: {
    backgroundColor: '#E7F5EF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewBtnText: {
    color: '#006C52',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  refreshBtn: {
    backgroundColor: '#006C52',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default FindParcelsScreen;
