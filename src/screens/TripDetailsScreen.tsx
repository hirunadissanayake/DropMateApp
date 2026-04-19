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
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'OK'
  });

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
      setTrip((prev: any) => ({ 
        ...prev, 
        requestedParcelIds: [...(prev.requestedParcelIds || []), parcelId] 
      }));

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
        
        {/* Action Button for Customers */}
        {user?.roleActive === 'CUSTOMER' && trip.travelerId !== user.id && trip.status === 'ACTIVE' && (
          <TouchableOpacity 
            style={[
              styles.requestButton,
              (requestingMatch || allRequested) && { opacity: 0.7 }
            ]}
            onPress={handleRequestPress}
            disabled={requestingMatch || allRequested}
          >
            <LinearGradient
              colors={(requestingMatch || allRequested) ? ['#94A3B8', '#64748B'] : ['#006C52', '#004D3A']}
              style={styles.requestGradient}
            >
              {requestingMatch ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.requestButtonText}>
                  {allRequested ? 'Already Requested' : 'Request this Traveler'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
        <View style={styles.travelerProfileSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLetterLarge}>{(trip.traveler?.name || 'T').charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.travelerNameLabel}>TRAVELER</Text>
            <Text style={styles.travelerNameValue}>{trip.traveler?.name || 'Anonymous Traveler'}</Text>
          </View>
        </View>

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
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{trip.capacityKg} kg</Text>
              {user?.id === trip.travelerId && trip.status === 'ACTIVE' && (
                <TouchableOpacity 
                  onPress={() => {
                    setNewCapacity(trip.capacityKg.toString());
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
                (updatingCapacity || newCapacity === trip.capacityKg.toString() || !newCapacity) && styles.disabledUpdateBtn
              ]}
              onPress={handleUpdateCapacity}
              disabled={updatingCapacity || newCapacity === trip.capacityKg.toString() || !newCapacity}
            >
              <LinearGradient 
                colors={
                  (updatingCapacity || newCapacity === trip.capacityKg.toString() || !newCapacity) 
                    ? ['#94A3B8', '#64748B'] 
                    : ['#006C52', '#004D3A']
                } 
                style={styles.updateGradient}
              >
                {updatingCapacity ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.updateBtnText}>
                    {newCapacity === trip.capacityKg.toString() ? 'No Changes' : 'Update Capacity'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  requestButton: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
    marginBottom: 20,
  },
  requestGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Manrope-Bold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Manrope-Bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    fontFamily: 'Manrope',
  },
  parcelList: {
    paddingBottom: 20,
  },
  parcelSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  parcelItemInfo: {
    flex: 1,
  },
  parcelItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  parcelItemRoute: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  parcelItemWeight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#006C52',
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  modalLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statEditBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 12,
  },
  capacityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  stepBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 24,
    color: '#0F172A',
    fontWeight: '600',
  },
  capacityDisplay: {
    flex: 1,
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  capacityInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#006C52',
    textAlign: 'center',
    padding: 0,
  },
  kgLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  inputHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  updateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  updateGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledUpdateBtn: {
    opacity: 0.7,
  },
  travelerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 16,
    marginBottom: 1,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#DCFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarLetterLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: '#006C52',
  },
  travelerNameLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  travelerNameValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
});

export default TripDetailsScreen;
