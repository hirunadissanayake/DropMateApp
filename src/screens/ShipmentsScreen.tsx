import React, { useState, useCallback } from 'react';
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
import Svg, { Path, Circle } from 'react-native-svg';
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
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

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
  paymentMethod: string;
  paymentStatus: string;
}

const ShipmentsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
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
  const [activeTab, setActiveTab] = useState<'ongoing' | 'history'>('ongoing');

  const s = makeStyles(theme);

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
      default: return theme.text.tertiary;
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
      style={s.parcelCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ParcelDetails', { parcelId: item.id })}
    >
      <View style={s.cardHeader}>
        <TouchableOpacity 
          style={s.imageWrapper}
          onPress={() => item.imageUrls && item.imageUrls.length > 0 && setActiveGallery({ images: item.imageUrls, index: 0 })}
        >
          {item.imageUrls && item.imageUrls[0] ? (
            <Image source={{ uri: item.imageUrls[0] }} style={s.parcelImage} />
          ) : (
            <View style={s.placeholderIcon}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" />
              </Svg>
            </View>
          )}
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.parcelName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.dateText}>{dayjs(item.createdAt).format('DD MMM YYYY • HH:mm')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={[s.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            {item.status.toUpperCase() === 'MATCHED' || item.status.toUpperCase() === 'ACCEPTED' ? (
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={getStatusColor(item.status)} strokeWidth="3" style={{ marginRight: 4 }}>
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            ) : (
              <View style={[s.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            )}
            <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase() === 'MATCHED' ? 'ACCEPTED' : item.status}
            </Text>
          </View>

          <View style={[
            s.paymentBadge, 
            { backgroundColor: item.paymentMethod === 'ONLINE' 
              ? (theme.isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF') 
              : (theme.isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB') }
          ]}>
             <Text style={[
               s.paymentBadgeText, 
               { color: item.paymentMethod === 'ONLINE' ? (theme.isDark ? '#60A5FA' : '#2563EB') : (theme.isDark ? '#FBBF24' : '#D97706') }
             ]}>
               {item.paymentMethod === 'ONLINE' ? 'CARD' : item.paymentMethod === 'CASH_ON_PICKUP' ? 'CASH (PICKUP)' : 'CASH (DELIVERY)'}
             </Text>
             <Text style={[s.paymentStatusDot, { color: item.paymentStatus === 'PAID' ? '#10B981' : theme.text.tertiary }]}>
               {" • "}
             </Text>
             <Text style={[
               s.paymentStatusText, 
               { color: item.paymentStatus === 'PAID' ? '#10B981' : (theme.isDark ? '#FBBF24' : '#D97706') }
             ]}>
               {item.paymentStatus}
             </Text>
          </View>

          {item.isRequested && item.status === 'PENDING' && (
            <View style={s.requestedBadgeSmall}>
              <Text style={s.requestedBadgeText}>REQUESTED</Text>
            </View>
          )}
        </View>

      </View>

      <View style={s.routeContainer}>
        <View style={s.routeTextContainer}>
          <View>
            <Text style={s.routeLabel}>PICKUP</Text>
            <Text style={s.locationText}>{item.fromLocation}</Text>
          </View>
          <View>
            <Text style={s.routeLabel}>DROP OFF</Text>
            <Text style={s.locationText}>{item.toLocation}</Text>
          </View>
        </View>
      </View>

      <View style={s.cardFooter}>
        <View style={s.detailItem}>
          <Text style={s.detailLabel}>WEIGHT</Text>
          <Text style={s.detailValue}>{item.weight} kg</Text>
        </View>
        
        <View style={s.footerDivider} />
        
        <View style={s.detailItem}>
          <Text style={s.detailLabel}>PRICE</Text>
          <Text style={s.detailValue}>LKR {item.price.toLocaleString()}</Text>
        </View>
      </View>

      {item.status.toUpperCase() === 'PENDING' && !item.isRequested && (
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtnBase, s.cancelBtnSmall, { flex: 1 }]}
            onPress={(e) => { e.stopPropagation(); handleCancelPress(item.id); }}
            activeOpacity={0.8}
          >
            <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" style={{ marginRight: 5 }}>
              <Path d="M18 6L6 18M6 6l12 12" />
            </Svg>
            <Text style={s.cancelBtnTextSmall}>Cancel Parcel</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status.toUpperCase() === 'CANCELLED' && (
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtnBase, s.deleteBtnSmall, { flex: 1 }]}
            onPress={(e) => { e.stopPropagation(); handleDeletePress(item.id); }}
            activeOpacity={0.8}
          >
            <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" style={{ marginRight: 5 }}>
              <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </Svg>
            <Text style={s.deleteBtnTextSmall}>Delete Parcel</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.screenTitle}>My Shipments</Text>
              <Text style={s.screenSubtitle}>Manage yours delivery parcels</Text>
            </View>
            <TouchableOpacity 
              style={s.headerAddBtn}
              onPress={() => navigation.navigate('CreateParcel')}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5">
                <Path d="M12 5V19M5 12H19" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.tabContainer}>
          <TouchableOpacity 
            style={[s.tabButton, activeTab === 'ongoing' && s.activeTabButton]}
            onPress={() => setActiveTab('ongoing')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === 'ongoing' && s.activeTabText]}>Ongoing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tabButton, activeTab === 'history' && s.activeTabButton]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, activeTab === 'history' && s.activeTabText]}>Delivered</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={parcels.filter(p => {
            const status = p.status.toUpperCase();
            const isHistoryStatus = status === 'DELIVERED';
            return activeTab === 'history' ? isHistoryStatus : !isHistoryStatus;
          })}
          renderItem={renderParcelItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
          }
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <View style={s.illustrationBox}>
                <Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5">
                  <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" />
                  <Path d="M3 8L12 13L21 8" />
                  <Path d="M12 21V13" />
                </Svg>
              </View>
              <Text style={s.emptyTitle}>No {activeTab === 'ongoing' ? 'Active' : 'Delivered'} Shipments</Text>
              <Text style={s.emptySubtitle}>
                {activeTab === 'ongoing' 
                  ? "Once you create a parcel, it will appear here for tracking."
                  : "You don't have any delivered parcels yet."}
              </Text>
            </View>
          }
        />
      </SafeAreaView>

      <TouchableOpacity 
        style={s.fab}
        onPress={() => navigation.navigate('CreateParcel')}
      >
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
          <Path d="M12 5V19M5 12H19" />
        </Svg>
      </TouchableOpacity>

      <Modal
        visible={!!activeGallery}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveGallery(null)}
      >
        <View style={s.modalBackground}>
          <SafeAreaView style={s.modalSafeArea}>
            <View style={s.modalHeaderPreview}>
              <Text style={s.modalCounter}>
                {activeGallery ? `${activeGallery.index + 1} / ${activeGallery.images.length}` : ''}
              </Text>
              <TouchableOpacity 
                style={s.modalCloseBtn}
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
                <View key={idx} style={s.fullImageWrapper}>
                  <Image 
                    source={{ uri: url }} 
                    style={s.fullImage}
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
        theme={theme}
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
        theme={theme}
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

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
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
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDark ? 0.3 : 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  screenTitle: {
    fontSize: 28,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
  },
  screenSubtitle: {
    fontSize: 14,
    color: theme.text.secondary,
    marginTop: 4,
    fontFamily: Typography.medium,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
  },
  activeTabButton: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 15,
    color: theme.text.tertiary,
    fontFamily: Typography.bold,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  parcelCard: {
    backgroundColor: theme.card,
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.isDark ? 0.3 : 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC',
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
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  dateText: {
    fontSize: 12,
    color: theme.text.tertiary,
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
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentBadgeText: {
    fontSize: 9,
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  paymentStatusDot: {
    fontSize: 10,
    fontFamily: Typography.bold,
  },
  paymentStatusText: {
    fontSize: 9,
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
  },
  requestedBadgeSmall: {
    backgroundColor: theme.primary,
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
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
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
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  routeLabel: {
    fontSize: 9,
    color: theme.text.tertiary,
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
    color: theme.text.tertiary,
    letterSpacing: 0.3,
    fontFamily: Typography.medium,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  footerDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.border,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  actionBtnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  cancelBtnSmall: {
    backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
  },
  cancelBtnTextSmall: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily: Typography.bold,
  },
  deleteBtnSmall: {
    backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
  },
  deleteBtnTextSmall: {
    fontSize: 12,
    color: '#EF4444',
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
    backgroundColor: theme.card,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.isDark ? 0.3 : 0.05,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyTitle: {
    fontSize: 20,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.text.tertiary,
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
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeaderPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalCounter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  modalCloseBtn: {
    padding: 8,
  },
  fullImageWrapper: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: '100%',
  },
});

export default ShipmentsScreen;
