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
  TextInput,
  RefreshControl,
  Linking,
  Image,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import Svg, {Path, Circle, Rect, Line} from 'react-native-svg';
import BackButton from '../components/common/BackButton';
import {useAuthStore} from '../store/authStore';
import * as tripService from '../services/tripService';
import * as parcelService from '../services/parcelService';
import * as deliveryService from '../services/deliveryService';
import CustomAlert from '../components/common/CustomAlert';
import { Modal, FlatList } from 'react-native';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import { Typography } from '../constants/Typography';

const {width} = Dimensions.get('window');

const TripDetailsScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TripDetails'>>();
  const {tripId} = route.params;
  const {token, user} = useAuthStore();

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isParcelModalVisible, setIsParcelModalVisible] = useState(false);
  const [myParcels, setMyParcels] = useState<any[]>([]);
  const [requestingMatch, setRequestingMatch] = useState(false);
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState('');
  const [updatingCapacity, setUpdatingCapacity] = useState(false);
  const [allRequested, setAllRequested] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'OK'
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDetails();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDetails();
  }, [tripId]);

  const fetchDetails = async () => {
    try {
      const response = await tripService.getTripDetails(token!, tripId);
      setTrip(response);
      
      // Check if all user's parcels are already requested for this trip
      if (user?.roleActive === 'CUSTOMER') {
        try {
          const parcels = await parcelService.getMyParcels(token!);
          const pendingParcels = parcels.filter((p: any) => p.status === 'PENDING');
          const available = pendingParcels.filter(
            (p: any) => !response.requestedParcelIds?.includes(p.id)
          );
          setAllRequested(pendingParcels.length > 0 && available.length === 0);
        } catch (err) {
          console.error("Error checking parcel status:", err);
        }
      }
    } catch (error) {
      console.error('Fetch details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPress = async () => {
    setRequestingMatch(true);
    try {
      const parcels = await parcelService.getMyParcels(token!);
      const pendingParcels = parcels.filter((p: any) => p.status === 'PENDING');
      
      // Filter out parcels that have already been requested for THIS specific trip
      const availableParcels = pendingParcels.filter(
        (p: any) => !trip.requestedParcelIds?.includes(p.id)
      );

      if (pendingParcels.length === 0) {
        setAlertConfig({
          visible: true,
          title: "No Pending Parcels",
          message: "You need to create a parcel first before you can request a traveler.",
          type: 'info',
          confirmText: "Create Parcel",
          onConfirm: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            navigation.navigate('CreateParcel');
          },
          onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
      } else if (availableParcels.length === 0) {
        setAlertConfig({
          visible: true,
          title: "Already Requested",
          message: "You have already sent requests for all your eligible parcels to this traveler.",
          type: 'info',
          confirmText: "OK",
          onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
          onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
      } else {
        setMyParcels(availableParcels);
        setIsParcelModalVisible(true);
      }
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Could not fetch your parcels. Please try again.",
        type: 'error',
        confirmText: "OK",
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setRequestingMatch(false);
    }
  };

  const submitMatchRequest = async (parcelId: string) => {
    setRequestingMatch(true);
    try {
      const response = await deliveryService.requestMatch(token!, { parcelId, tripId });
      setIsParcelModalVisible(false);
      
      // Update local trip state to include the new requested parcel ID
      setTrip((prev: any) => {
        const updatedRequestedIds = [...(prev.requestedParcelIds || []), parcelId];
        
        // Recalculate allRequested based on the updated requestedParcelIds
        // We use the current myParcels list and check how many would be left
        const remainingParcels = myParcels.filter(p => p.id !== parcelId);
        setAllRequested(myParcels.length > 0 && remainingParcels.length === 0);
        setMyParcels(remainingParcels);

        return { 
          ...prev, 
          requestedParcelIds: updatedRequestedIds 
        };
      });

      setTimeout(() => {
        setAlertConfig({
          visible: true,
          title: "Request Sent!",
          message: "The traveler has been notified. You will be matched once they accept your request.",
          type: 'success',
          confirmText: "OK",
          onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
          onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
      }, 500);
      
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Request Failed",
        message: error.message || "Something went wrong.",
        type: 'error',
        confirmText: "OK",
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setRequestingMatch(false);
    }
  };

  const handleUpdateCapacity = async () => {
    if (!newCapacity || isNaN(Number(newCapacity))) {
       setAlertConfig({
         visible: true,
         title: "Invalid Input",
         message: "Please enter a valid number for capacity.",
         type: 'error',
         confirmText: "OK",
         onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
         onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
       });
       return;
    }

    setUpdatingCapacity(true);
    try {
      await tripService.updateTripCapacity(token!, tripId, Number(newCapacity));
      setIsEditingCapacity(false);
      setAlertConfig({
        visible: true,
        title: "Success",
        message: "Your trip capacity has been updated.",
        type: 'success',
        confirmText: "OK",
        onConfirm: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          fetchDetails();
        },
        onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Update Failed",
        message: error.message || "Could not update capacity.",
        type: 'error',
        confirmText: "OK",
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setUpdatingCapacity(false);
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
      case 'MATCHED':
        return '#E0E7FF';
      case 'PICKED_UP':
        return '#FEF08A';
      case 'DELIVERED':
        return '#D1FAE5';
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
      case 'MATCHED':
        return '#4338CA';
      case 'PICKED_UP':
        return '#A16207';
      case 'DELIVERED':
        return '#059669';
      default:
        return '#475569';
    }
  };

  const usedCap = trip?.usedCapacity ?? 0;
  const totalCap = trip?.capacityKg ?? 1;
  const capPercentage = Math.min((usedCap / totalCap) * 100, 100);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006C52" />
        </View>
      ) : !trip ? null : (
        <>
          <View style={styles.modernHeader}>
            <SafeAreaView style={styles.headerSafeArea}>
              <View style={styles.headerTop}>
                <BackButton onPress={() => navigation.goBack()} color="#0F172A" />
                <View style={styles.headerProfile}>
                  <View style={styles.avatarMini}>
                    {trip.traveler?.selfieUrl ? (
                      <Image source={{ uri: trip.traveler.selfieUrl }} style={styles.avatarImgMini} />
                    ) : (
                      <Text style={styles.avatarLetterMini}>
                        {(trip.traveler?.name || 'T').charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.travelerNameLabel}>
                      TRAVELER • #{trip.id.substring(0, 8).toUpperCase()}
                    </Text>
                    <Text style={styles.travelerNameValue}>{trip.traveler?.name || 'Traveler'}</Text>
                  </View>
                </View>
                <View style={{ width: 40 }} />
              </View>
            </SafeAreaView>
          </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006C52']} />
        }>
        
        

        <View style={styles.itineraryCard}>
           <Text style={styles.sectionLabelPremium}>TRAVEL ITINERARY</Text>
           
           <View style={styles.itineraryLineRow}>
             <View style={styles.itiVisual}>
               <View style={styles.itiDot} />
               <View style={styles.itiDashedLine} />
               <View style={styles.itiPin}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="#EF4444">
                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <Circle cx="12" cy="10" r="3" fill="white" />
                  </Svg>
               </View>
             </View>
             
             <View style={styles.itiContent}>
               <View style={styles.itiPoint}>
                 <View style={styles.itiPointHeader}>
                   <Text style={styles.itiPointLabel}>PICKUP</Text>
                    {!!trip.pickupUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(trip.pickupUrl)} style={styles.itiMapBtn}>
                      <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <Circle cx="12" cy="10" r="3" />
                      </Svg>
                      <Text style={[styles.itiMapText, { color: '#006C52' }]}>View Map</Text>
                    </TouchableOpacity>
                   )}
                 </View>
                 <Text style={styles.itiCity}>{trip.fromLocation}</Text>
                 <Text style={styles.itiDate}>{dayjs(trip.travelDate).format('dddd, MMMM DD')}</Text>
               </View>

               <View style={[styles.itiPoint, { marginTop: 30 }]}>
                 <View style={styles.itiPointHeader}>
                   <Text style={[styles.itiPointLabel, { color: '#EF4444' }]}>DESTINATION</Text>
                    {!!trip.dropoffUrl && (
                    <TouchableOpacity onPress={() => Linking.openURL(trip.dropoffUrl)} style={styles.itiMapBtn}>
                      <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <Circle cx="12" cy="10" r="3" />
                      </Svg>
                      <Text style={[styles.itiMapText, { color: '#EF4444' }]}>View Map</Text>
                    </TouchableOpacity>
                   )}
                 </View>
                 <Text style={styles.itiCity}>{trip.toLocation}</Text>
                 <View style={styles.itiFooter}>
                   <View style={styles.itiVehicleBadge}>
                     <Text style={styles.itiVehicleText}>{trip.vehicleType || 'Car'}</Text>
                   </View>
                   <Text style={styles.itiTimeText}>{trip.travelTime || 'Flexible Time'}</Text>
                 </View>
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
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{trip.capacityKg ?? 0} kg</Text>
              {user?.id === trip.travelerId && trip.status === 'ACTIVE' && !trip.isExpired && (
                <TouchableOpacity 
                  onPress={() => {
                    setNewCapacity((trip.capacityKg ?? 0).toString());
                    setIsEditingCapacity(true);
                  }}
                  style={styles.statEditBtn}
                >
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </Svg>
                </TouchableOpacity>
              )}
            </View>
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

        {user?.id === trip.travelerId && (
          <View style={styles.infoBlock}>
            <Text style={styles.sectionLabel}>
              ASSIGNED PARCELS ({trip.parcels?.length || 0})
            </Text>
            {trip.parcels && trip.parcels.length > 0 ? (
              trip.parcels.map((parcel: any, idx: number) => (
                <TouchableOpacity
                  key={parcel.id}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('ParcelDetails', { parcelId: parcel.id })}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8 }}>
                      <Text style={[styles.parcelName, { flex: 1 }]} numberOfLines={1}>
                        {parcel.name}
                      </Text>
                      {parcel.status && (
                        <View style={{
                           backgroundColor: getStatusBg(parcel.status),
                           paddingHorizontal: 8,
                           paddingVertical: 2,
                           borderRadius: 12,
                           marginLeft: 8
                        }}>
                           <Text style={{
                             fontSize: 10,
                             fontFamily: Typography.bold,
                             color: getStatusColor(parcel.status),
                             textTransform: 'uppercase'
                           }}>
                             {parcel.status.replace('_', ' ')}
                           </Text>
                        </View>
                      )}
                    </View>
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
        )}

        {user?.id !== trip.travelerId && (
          <View style={styles.premiumActionFooter}>
           
             <TouchableOpacity 
                style={[
                  styles.premiumBookBtn,
                  (requestingMatch || allRequested) && styles.premiumBookBtnDisabled
                ]}
                onPress={handleRequestPress}
                disabled={requestingMatch || allRequested}
              >
                {requestingMatch ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.premiumBookBtnText}>
                      {allRequested ? 'Requested' : 'Request Now'}
                    </Text>
                    {!allRequested && (
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <Path d="M9 18l6-6-6-6" />
                      </Svg>
                    )}
                  </>
                )}
             </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Parcel Selection Modal */}
      <Modal
        visible={isParcelModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsParcelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Parcel</Text>
              <TouchableOpacity onPress={() => setIsParcelModalVisible(false)}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Choose a parcel you want this traveler to carry</Text>
            
            <FlatList
              data={myParcels}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.parcelList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.parcelSelectItem}
                  onPress={() => submitMatchRequest(item.id)}
                >
                  <View style={styles.parcelItemInfo}>
                    <Text style={styles.parcelItemName}>{item.name}</Text>
                    <Text style={styles.parcelItemRoute}>{item.fromLocation} → {item.toLocation}</Text>
                    <Text style={styles.parcelItemWeight}>{item.weight}Kg</Text>
                  </View>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>No pending parcels found.</Text>
                </View>
              }
            />
            
            {requestingMatch && (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#006C52" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />

      {/* Edit Capacity Modal */}
      <Modal
        visible={isEditingCapacity}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditingCapacity(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 30 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Capacity Limit</Text>
              <TouchableOpacity onPress={() => setIsEditingCapacity(false)}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>How much total weight can you carry in this trip?</Text>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>TOTAL CAPACITY (KG)</Text>
              <View style={styles.capacityInputContainer}>
                <TouchableOpacity 
                  style={styles.stepBtn}
                  onPress={() => setNewCapacity(prev => Math.max(0, (Number(prev) || 0) - 1).toString())}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                
                <View style={styles.capacityDisplay}>
                  <TextInput
                    style={styles.capacityInput}
                    value={newCapacity}
                    onChangeText={(text) => setNewCapacity(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    maxLength={3}
                  />
                  <Text style={styles.kgLabel}>kg</Text>
                </View>

                <TouchableOpacity 
                  style={styles.stepBtn}
                  onPress={() => setNewCapacity(prev => ((Number(prev) || 0) + 1).toString())}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>Note: You cannot reduce this below already assigned parcels.</Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.updateBtn,
                (updatingCapacity || newCapacity === (trip.capacityKg ?? 0).toString() || !newCapacity) && styles.disabledUpdateBtn
              ]}
              onPress={handleUpdateCapacity}
              disabled={updatingCapacity || newCapacity === (trip.capacityKg ?? 0).toString() || !newCapacity}
            >
              <LinearGradient 
                colors={
                  (updatingCapacity || newCapacity === (trip.capacityKg ?? 0).toString() || !newCapacity) 
                    ? ['#94A3B8', '#64748B'] 
                    : ['#006C52', '#004D3A']
                } 
                style={styles.updateGradient}
              >
                {updatingCapacity ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.updateBtnText}>
                    {newCapacity === (trip.capacityKg ?? 0).toString() ? 'No Changes' : 'Update Capacity'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  modernHeader: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    zIndex: 10,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'ios' ? 10 : 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  avatarImgMini: {
    width: '100%',
    height: '100%',
  },
  avatarLetterMini: {
    fontSize: 18,
    color: '#006C52',
    fontFamily: Typography.extraBold,
  },
  travelerNameLabel: {
    fontSize: 9,
    fontFamily: Typography.extraBold,
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: -2,
  },
  travelerNameValue: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.extraBold,
  },
  scrollContent: {
    paddingBottom: 120, // Space for floating footer
  },
  itineraryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 20, 
    borderRadius: 24,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionLabelPremium: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Typography.extraBold,
    letterSpacing: 2,
    marginBottom: 24,
  },
  itineraryLineRow: {
    flexDirection: 'row',
  },
  itiVisual: {
    width: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  itiDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: '#006C52',
    backgroundColor: '#FFF',
  },
  itiDashedLine: {
    flex: 1,
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  itiPin: {
    marginTop: 0,
  },
  itiContent: {
    flex: 1,
    paddingLeft: 20,
  },
  itiPoint: {
    flex: 1,
  },
  itiPointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itiPointLabel: {
    fontSize: 10,
    color: '#006C52',
    fontFamily: Typography.extraBold,
    letterSpacing: 0.5,
  },
  itiMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itiMapText: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
  },
  itiCity: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Typography.extraBold,
  },
  itiDate: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Typography.medium,
    marginTop: 2,
  },
  itiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  itiVehicleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itiVehicleText: {
    fontSize: 10,
    color: '#475569',
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
  },
  itiTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Typography.medium,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: Typography.extraBold,
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statEditBtn: {
    padding: 2,
  },
  infoBlock: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Typography.extraBold,
    letterSpacing: 1,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    color: '#006C52',
    fontFamily: Typography.bold,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#006C52',
    borderRadius: 4,
  },
  availText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
    fontFamily: Typography.medium,
  },
  parcelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  parcelIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parcelInfo: {
    flex: 1,
  },
  parcelName: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  parcelMeta: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Typography.regular,
  },
  parcelArrow: {
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyParcelsText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: Typography.regular,
  },
  meetingPointCard: {
    backgroundColor: '#F8FAFC',
  },
  meetingPointText: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Typography.bold,
    lineHeight: 22,
  },
  premiumActionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  footerPriceCol: {
    flex: 1,
  },
  footerPriceLbl: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: Typography.extraBold,
    textTransform: 'uppercase',
  },
  footerPriceVal: {
    fontSize: 18,
    color: '#006C52',
    fontFamily: Typography.extraBold,
  },
  premiumBookBtn: {
    flex: 1.5,
    backgroundColor: '#006C52',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  premiumBookBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  premiumBookBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.extraBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    color: '#0F172A',
    fontFamily: Typography.extraBold,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    fontFamily: Typography.regular,
  },
  parcelSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  parcelItemInfo: {
    flex: 1,
  },
  parcelItemName: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  parcelItemRoute: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  parcelItemWeight: {
    fontSize: 12,
    color: '#006C52',
    fontFamily: Typography.extraBold,
    marginTop: 2,
  },
  parcelList: {
    paddingBottom: 20,
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: Typography.regular,
  },
  modalLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
  },
  inputWrapper: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Typography.extraBold,
    marginBottom: 20,
    textAlign: 'center',
  },
  capacityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 24,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  capacityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 120,
  },
  capacityInput: {
    fontSize: 24,
    color: '#006C52',
    fontFamily: Typography.extraBold,
    padding: 0,
    textAlign: 'center',
  },
  kgLabel: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: Typography.bold,
    marginLeft: 4,
  },
  inputHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: Typography.regular,
    marginTop: 10,
  },
  updateBtn: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  updateGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.extraBold,
  },
  disabledUpdateBtn: {
    opacity: 0.6,
  },
});

export default TripDetailsScreen;
