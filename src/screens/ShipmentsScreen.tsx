import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import * as parcelService from '../services/parcelService';
import dayjs from 'dayjs';
import CustomAlert from '../components/common/CustomAlert';
import Toast from 'react-native-toast-message';
import { Typography } from '../constants/Typography';

const { width } = Dimensions.get('window');

interface Parcel {
  id: string;
  name: string;
  fromLocation: string;
  toLocation: string;
  status: string;
  price: number;
  weight: number;
  imageUrls: string[];
  createdAt: string;
  isRequested?: boolean;
}

const ShipmentsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGallery, setActiveGallery] = useState<{ images: string[], index: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isCancelAlertVisible, setIsCancelAlertVisible] = useState(false);
  const [isDeleteAlertVisible, setIsDeleteAlertVisible] = useState(false);
  const [cancellingParcelId, setCancellingParcelId] = useState<string | null>(null);
  const [deletingParcelId, setDeletingParcelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchParcels = async () => {
    if (!token) return;
    try {
      const data = await parcelService.getMyParcels(token);
      setParcels(data);
    } catch (error) {
      console.error('Fetch parcels error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchParcels();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchParcels();
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return '#F59E0B';
      case 'DELIVERED': return '#059669';
      case 'CANCELLED': return '#DC2626';
      case 'IN_TRANSIT': return '#3B82F6';
      case 'ACCEPTED':
      case 'MATCHED': return '#059669';
      default: return '#64748B';
    }
  };

  const handleCancelPress = (id: string) => {
    setCancellingParcelId(id);
    setIsCancelAlertVisible(true);
  };

  const confirmCancel = async () => {
    if (!token || !cancellingParcelId) return;
    
    setActionLoading(true);
    try {
      await parcelService.cancelParcel(token, cancellingParcelId);
      setIsCancelAlertVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Parcel Cancelled',
        text2: 'Your parcel has been cancelled successfully.',
      });
      fetchParcels();
    } catch (error) {
      console.error('Cancel parcel error:', error);
    } finally {
      setActionLoading(false);
      setCancellingParcelId(null);
    }
  };

  const handleDeletePress = (id: string) => {
    setDeletingParcelId(id);
    setIsDeleteAlertVisible(true);
  };

  const confirmDelete = async () => {
    if (!token || !deletingParcelId) return;
    
    setActionLoading(true);
    try {
      await parcelService.deleteParcel(token, deletingParcelId);
      setIsDeleteAlertVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Parcel Deleted',
        text2: 'The parcel record has been permanently removed.',
      });
      fetchParcels();
    } catch (error) {
      console.error('Delete parcel error:', error);
    } finally {
      setActionLoading(false);
      setDeletingParcelId(null);
    }
  };

  const renderParcelItem = ({ item }: { item: Parcel }) => (
    <TouchableOpacity 
      style={styles.parcelCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ParcelDetails', { parcelId: item.id })}
    >
      <View style={styles.cardHeader}>
        <TouchableOpacity 
          style={styles.imageWrapper}
          onPress={() => item.imageUrls && item.imageUrls.length > 0 && setActiveGallery({ images: item.imageUrls, index: 0 })}
        >
          {item.imageUrls && item.imageUrls[0] ? (
            <Image source={{ uri: item.imageUrls[0] }} style={styles.parcelImage} />
          ) : (
            <View style={styles.placeholderIcon}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" />
              </Svg>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.parcelName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.dateText}>{dayjs(item.createdAt).format('DD MMM YYYY • HH:mm')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            {item.status.toUpperCase() === 'MATCHED' || item.status.toUpperCase() === 'ACCEPTED' ? (
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={getStatusColor(item.status)} strokeWidth="3" style={{ marginRight: 4 }}>
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            ) : (
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            )}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase() === 'MATCHED' ? 'ACCEPTED' : item.status}
            </Text>
          </View>
          {item.isRequested && item.status === 'PENDING' && (
            <View style={styles.requestedBadgeSmall}>
              <Text style={styles.requestedBadgeText}>REQUESTED</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeTextContainer}>
          <View>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text style={styles.locationText}>{item.fromLocation}</Text>
          </View>
          <View>
            <Text style={styles.routeLabel}>DROP OFF</Text>
            <Text style={styles.locationText}>{item.toLocation}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>WEIGHT</Text>
          <Text style={styles.detailValue}>{item.weight} kg</Text>
        </View>
        
        <View style={styles.footerDivider} />
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>PRICE</Text>
          <Text style={styles.detailValue}>LKR {item.price.toLocaleString()}</Text>
        </View>

        {(item.status === 'PENDING' || item.status === 'CANCELLED') && (
          <>
            <View style={styles.footerDivider} />
            <View style={styles.actionCol}>
              {item.status === 'PENDING' ? (
                <TouchableOpacity 
                  style={styles.cancelBtnSmall} 
                  onPress={() => handleCancelPress(item.id)}
                >
                  <Text style={styles.cancelBtnTextSmall}>Cancel</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.deleteBtnSmall} 
                  onPress={() => handleDeletePress(item.id)}
                >
                  <Text style={styles.deleteBtnTextSmall}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006C52" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#F0FFF8', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.screenTitle}>My Shipments</Text>
              <Text style={styles.screenSubtitle}>Manage yours delivery parcels</Text>
            </View>
            <TouchableOpacity 
              style={styles.headerAddBtn}
              onPress={() => navigation.navigate('CreateParcel')}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                <Path d="M12 5V19M5 12H19" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={parcels}
          renderItem={renderParcelItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#006C52" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.illustrationBox}>
                <Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5">
                  <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" />
                  <Path d="M3 8L12 13L21 8" />
                  <Path d="M12 21V13" />
                </Svg>
              </View>
              <Text style={styles.emptyTitle}>No Shipments Yet</Text>
              <Text style={styles.emptySubtitle}>Once you create a parcel, it will appear here for tracking.</Text>
            </View>
          }
        />
      </SafeAreaView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateParcel')}
      >
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
          <Path d="M12 5V19M5 12H19" />
        </Svg>
      </TouchableOpacity>

      {/* Image Preview Modal Swiper */}
      <Modal
        visible={!!activeGallery}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveGallery(null)}
      >
        <View style={styles.modalBackground}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalCounter}>
                {activeGallery ? `${activeGallery.index + 1} / ${activeGallery.images.length}` : ''}
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setActiveGallery(null)}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                if (activeGallery) {
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                  setActiveGallery({ ...activeGallery, index: newIndex });
                }
              }}
            >
              {activeGallery?.images.map((url, idx) => (
                <View key={idx} style={styles.fullImageWrapper}>
                  <Image 
                    source={{ uri: url }} 
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <CustomAlert
        visible={isCancelAlertVisible}
        title="Cancel Parcel"
        message="Are you sure you want to cancel this parcel? This action cannot be undone."
        onCancel={() => setIsCancelAlertVisible(false)}
        onConfirm={confirmCancel}
        confirmText="Yes, Cancel"
        cancelText="No, Keep"
        type="warning"
        loading={actionLoading}
      />

      <CustomAlert
        visible={isDeleteAlertVisible}
        title="Delete Parcel"
        message="Are you sure you want to permanently delete this parcel record?"
        onCancel={() => setIsDeleteAlertVisible(false)}
        onConfirm={confirmDelete}
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        type="warning"
        loading={actionLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0FDF4',
  },
  screenTitle: {
    fontSize: 28,
    color: '#0F172A',
    fontFamily: Typography.extraBold,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Typography.medium,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  parcelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parcelImage: {
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    opacity: 0.5,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  parcelName: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: Typography.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestedBadgeSmall: {
    backgroundColor: '#006C52',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requestedBadgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Typography.bold,
  },
  routeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  routeTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  locationText: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  routeLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: Typography.bold,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 8,
    color: '#94A3B8',
    letterSpacing: 0.3,
    fontFamily: Typography.medium,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
  actionCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnSmall: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  cancelBtnTextSmall: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: Typography.bold,
  },
  deleteBtnSmall: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteBtnTextSmall: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: Typography.bold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  illustrationBox: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: Typography.medium,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#006C52',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 60,
  },
  modalCounter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Typography.bold,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageWrapper: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: '80%',
  },
});

export default ShipmentsScreen;
