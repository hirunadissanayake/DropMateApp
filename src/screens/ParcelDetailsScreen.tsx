import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  StatusBar,
  Modal,
  ActivityIndicator,
  Share,
  FlatList,
  TextInput,
  RefreshControl,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/common/BackButton';
import { useAuthStore } from '../store/authStore';
import * as parcelService from '../services/parcelService';
import * as tripService from '../services/tripService';
import * as deliveryService from '../services/deliveryService';
import * as reviewService from '../services/reviewService';
import RatingModal from '../components/common/RatingModal';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import CustomAlert from '../components/common/CustomAlert';
import { Typography } from '../constants/Typography';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const { width } = Dimensions.get('window');

const ParcelDetailsScreen = () => {
  const { theme } = useTheme();
  const scrollRef = React.useRef<ScrollView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ParcelDetails'>>();
  const { parcelId } = route.params;
  const insets = useSafeAreaInsets();
  const { token, user } = useAuthStore();

  const [parcel, setParcel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Trip Selection State
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [isTripModalVisible, setIsTripModalVisible] = useState(false);
  const [requestingMatch, setRequestingMatch] = useState(false);

  // OTP & Payment State
  const [otpCode, setOtpCode] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpType, setOtpType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [processingOtp, setProcessingOtp] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Rating State
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingConfig, setRatingConfig] = useState({
    title: '',
    subtitle: '',
    revieweeId: ''
  });
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    onConfirm: () => void;
    confirmText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  const styles = makeStyles(theme);

  // Derived visibility flags
  const statusUpper = parcel?.status?.toUpperCase();
  const isMatchedState = ['MATCHED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'].includes(statusUpper);
  const isSender = parcel && user ? String(user.id) === String(parcel.senderId) || String(user.id) === String(parcel.sender?.id) : false;
  const isTraveler = parcel?.matchedTrip?.travelerId && user ? String(user.id) === String(parcel.matchedTrip.travelerId) : false;


  useFocusEffect(
    React.useCallback(() => {
      fetchDetails();
    }, [parcelId, token])
  );

  const fetchDetails = async () => {
    try {
      const data = await parcelService.getParcelDetails(token!, parcelId);
      setParcel(data);
    } catch (error) {
      console.error('Fetch details error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#F59E0B';
      case 'DELIVERED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      case 'IN_TRANSIT': return '#3B82F6';
      default: return theme.text.tertiary;
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my parcel: ${parcel.name} from ${parcel.fromLocation} to ${parcel.toLocation}. ID: ${parcel.id}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRequestPress = async () => {
    setRequestingMatch(true);
    try {
      const trips = await tripService.getMyTrips(token!);
      const activeTrips = trips.filter((t: any) => t.status === 'ACTIVE');

      if (activeTrips.length === 0) {
        setAlertConfig({
          visible: true,
          title: "No Active Trips",
          message: "You need to create a trip first before you can request to carry a parcel.",
          type: 'info',
          confirmText: "Create Trip",
          onConfirm: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            navigation.navigate('CreateTrip');
          }
        });
      } else {
        setMyTrips(activeTrips);
        setIsTripModalVisible(true);
      }
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Could not fetch your trips. Please try again.",
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setRequestingMatch(false);
    }
  };

  const submitMatchRequest = async (tripId: string) => {
    setRequestingMatch(true);
    try {
      const response = await deliveryService.requestMatch(token!, { parcelId, tripId });
      setIsTripModalVisible(false);
      setParcel((prev: any) => ({ ...prev, userMatch: response.match }));

      setTimeout(() => {
        setAlertConfig({
          visible: true,
          title: "Request Sent!",
          message: "The customer has been notified. You will be matched once they accept your request.",
          type: 'success',
          onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
      }, 500);
      
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Request Failed",
        message: error.message || "Something went wrong.",
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setRequestingMatch(false);
    }
  };

  const handleAcceptMatch = async (matchId: string) => {
    setLoading(true);
    try {
      await deliveryService.acceptMatch(token!, matchId);
      setAlertConfig({
        visible: true,
        title: "Match Accepted!",
        message: "You have successfully matched with this traveler. You can now see their contact details.",
        type: 'info',
        confirmText: 'OK',
        onConfirm: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          fetchDetails();
        }
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message || "Failed to accept match.",
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    setLoading(true);
    try {
      await deliveryService.rejectMatch(token!, matchId);
      setAlertConfig({
        visible: true,
        title: "Match Rejected",
        message: "The request has been declined.",
        type: 'info',
        onConfirm: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          fetchDetails();
        }
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message || "Failed to reject match.",
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePickup = async () => {
    setLoading(true);
    try {
      await deliveryService.initiatePickup(token!, parcelId);
      setAlertConfig({
        visible: true,
        title: "OTP Sent",
        message: "A pickup OTP has been sent to the sender. Ask them for the code to confirm pickup.",
        type: 'success',
        confirmText: 'OK',
        onConfirm: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          setOtpType('PICKUP');
          setOtpModalVisible(true);
        }
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message || "Failed to initiate pickup.",
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 4) return;
    setProcessingOtp(true);
    try {
      if (otpType === 'PICKUP') {
        await deliveryService.verifyPickup(token!, parcelId, otpCode);
        setOtpModalVisible(false);
        setAlertConfig({
          visible: true,
          title: "Picked Up!",
          message: "You have successfully picked up the parcel. It is now in transit.",
          type: 'success',
          confirmText: 'OK',
          onConfirm: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            setActionLoading(true);
            fetchDetails().finally(() => setActionLoading(false));
          }
        });
      } else {
        await deliveryService.verifyDelivery(token!, parcelId, otpCode);
        setOtpModalVisible(false);
        setAlertConfig({
          visible: true,
          title: "Delivered!",
          message: "Parcel delivered successfully. Payment has been processed.",
          type: 'success',
          confirmText: 'OK',
          onConfirm: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            setRatingConfig({
              title: 'Rate the Sender',
              subtitle: `How was your experience with ${parcel.sender?.name || 'the sender'}?`,
              revieweeId: parcel.senderId
            });
            setRatingModalVisible(true);
            setActionLoading(true);
            fetchDetails().finally(() => setActionLoading(false));
          }
        });
      }
      setOtpCode('');
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Verification Failed",
        message: error.message || "Invalid OTP code.",
        type: 'error',
        confirmText: 'OK',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setProcessingOtp(false);
    }
  };

  const handleRateSubmit = async (rating: number, comment: string) => {
    setRatingSubmitting(true);
    try {
      await reviewService.createReview(token!, {
        rating,
        comment,
        parcelId,
        revieweeId: ratingConfig.revieweeId
      });
      setRatingModalVisible(false);
      
      // Refresh details to update the button status
      await fetchDetails();

      setAlertConfig({
        visible: true,
        title: "Success",
        message: "Thank you for your rating!",
        type: 'success',
        confirmText: 'OK',
        onConfirm: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
        }
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message || "Failed to submit rating.",
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleInitiateDelivery = async () => {
    setLoading(true);
    try {
      await deliveryService.initiateDelivery(token!, parcelId);
      setAlertConfig({
        visible: true,
        title: "Delivery Started",
        message: "A delivery OTP has been sent to the receiver. Ask them for the code to confirm delivery.",
        type: 'success',
        confirmText: 'OK',
        onConfirm: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          setOtpType('DELIVERY');
          setOtpModalVisible(true);
        }
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: error.message || "Failed to initiate delivery.",
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Error', 'Phone number not available');
    }
  };

  const handlePay = () => {
    navigation.navigate('Payment', { parcelId, amount: parcel.price });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!parcel) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={theme.isDark ? theme.bgGradient : ['#F0FFF8', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.primary]} 
            tintColor={theme.primary}
          />
        }
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveImage(Math.round(x / width));
            }}
            scrollEventThrottle={16}
          >
            {parcel.imageUrls && parcel.imageUrls.length > 0 ? (
              parcel.imageUrls.map((url: string, index: number) => (
                <TouchableOpacity 
                  key={index} 
                  activeOpacity={0.9}
                  onPress={() => {
                    setActiveImage(index);
                    setIsModalVisible(true);
                  }}
                >
                  <Image source={{ uri: url }} style={styles.mainImage} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noImageContainer}>
                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.border} strokeWidth="1.5">
                  <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" />
                </Svg>
                <Text style={styles.noImageText}>No Photos Available</Text>
              </View>
            )}
          </ScrollView>
          
          {/* Back Action */}
          <View style={[styles.absHeader, { top: insets.top + (Platform.OS === 'ios' ? 10 : 35) }]}>
            <BackButton onPress={() => navigation.goBack()} color={theme.text.primary} />
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5">
                <Path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.34832 22 5.8 22H18.2C18.6517 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" />
                <Path d="M16 6L12 2L8 6" />
                <Path d="M12 2V15" />
              </Svg>
            </TouchableOpacity>
          </View>

          {parcel.imageUrls?.length > 1 && (
            <>
              {activeImage > 0 && (
                <TouchableOpacity 
                  style={[styles.sliderBtn, styles.leftSliderBtn]}
                  onPress={() => scrollRef.current?.scrollTo({ x: (activeImage - 1) * width, animated: true })}
                >
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                    <Path d="M15 18l-6-6 6-6" />
                  </Svg>
                </TouchableOpacity>
              )}
              {activeImage < parcel.imageUrls.length - 1 && (
                <TouchableOpacity 
                  style={[styles.sliderBtn, styles.rightSliderBtn]}
                  onPress={() => scrollRef.current?.scrollTo({ x: (activeImage + 1) * width, animated: true })}
                >
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
              )}
              
              <View style={styles.dotsContainer}>
                {parcel.imageUrls.map((_: any, i: number) => (
                  <View key={i} style={[styles.dot, activeImage === i && styles.activeDot]} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <View style={styles.headerInfo}>
            <View>
              <Text style={styles.parcelName}>{parcel.name}</Text>
              <Text style={styles.parcelId}>ID : #{parcel.id.substring(0, 8).toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(parcel.status)}15` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(parcel.status) }]}>{parcel.status}</Text>
            </View>
          </View>

          <View style={styles.cardSeparator} />

          {/* Route Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>DELIVERY ROUTE</Text>
            <View style={styles.routeBox}>
              <View style={styles.routeLineCenter}>
                <View style={styles.routeDot} />
                <View style={styles.routeDashed} />
                <View style={[styles.routeDot, styles.routeDotOutline]} />
              </View>
              <View style={styles.routeTexts}>
                <View>
                  <Text style={styles.locLabel}>PICKUP FROM</Text>
                  <Text style={styles.locValue}>{parcel.fromLocation}</Text>
                </View>
                <View style={{ marginTop: 24 }}>
                  <Text style={styles.locLabel}>DELIVER TO</Text>
                  <Text style={styles.locValue}>{parcel.toLocation}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recipient Info */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>RECEIVER DETAILS</Text>
            {parcel.receiverName ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={styles.personName}>{parcel.receiverName}</Text>
                  <Text style={styles.personPhone}>{parcel.receiverPhone}</Text>
                </View>
                {parcel.receiverPhone && (
                  <TouchableOpacity 
                    style={styles.callButton} 
                    activeOpacity={0.7}
                    onPress={() => handleCall(parcel.receiverPhone)}
                  >
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
                      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-2.11a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.hiddenInfo}>Hidden until matched</Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.gridItemFull}>
            <Text style={styles.gridLabel}>CATEGORY</Text>
            <Text style={styles.gridValue} numberOfLines={1}>{parcel.category?.name || 'General'}</Text>
          </View>

          {/* Parcel Details Grid */}
          <View style={styles.detailsGrid}>
            {parcel.weight != null && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>WEIGHT</Text>
                <Text style={styles.gridValue}>{parcel.weight} Kg</Text>
              </View>
            )}
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>METHOD</Text>
              <Text style={styles.gridValue}>{parcel.deliveryMethod}</Text>
            </View>
            <View style={styles.gridItem}>
               <Text style={styles.gridLabel}>POSTED</Text>
               <Text style={styles.gridValue}>{dayjs(parcel.createdAt).format('MMM DD')}</Text>
            </View>
          </View>

          {/* Description */}
          {parcel.description && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>DESCRIPTION</Text>
              <Text style={styles.descText}>{parcel.description}</Text>
            </View>
          )}

          {/* Note */}
          {parcel.note && (
            <View style={[styles.sectionCard, styles.noteCard]}>
              <Text style={styles.sectionLabel}>SPECIAL NOTE</Text>
              <Text style={styles.noteText}>"{parcel.note}"</Text>
            </View>
          )}

          {/* Pricing Section */}
          <View style={styles.priceCardContainer}>
            <View style={styles.priceCard}>
              <LinearGradient
                colors={theme.isDark ? ['#1A3D30', '#0D1F18'] : ['#006C52', '#004D3A']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.priceGradient}>
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceLabel}>Total Price</Text>
                    <Text style={styles.priceValue}>LKR {parcel.price?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.paymentBadge}>
                    <Text style={styles.paymentMethodText}>
                      {parcel.paymentMethod === 'ONLINE' ? 'CARD' : parcel.paymentMethod === 'CASH_ON_PICKUP' ? 'CASH ON PICKUP' : 'CASH ON DELIVERY'}
                    </Text>
                    <Text style={[styles.paymentStatusText, { color: parcel.paymentStatus === 'PAID' ? '#4ADE80' : '#F87171' }]}>
                      {parcel.paymentStatus}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceSubRows}>
                  <View style={styles.pSubRow}>
                    <Text style={styles.pSubLabel}>Service Fee</Text>
                    <Text style={styles.pSubValue}>LKR {parcel.platformFee?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.pSubRow}>
                    <Text style={styles.pSubLabel}>Traveler Payout</Text>
                    <Text style={styles.pSubValue}>LKR {parcel.travelerPayout?.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Customer Online Payment */}
          {isSender && statusUpper === 'MATCHED' && parcel.paymentMethod === 'ONLINE' && parcel.paymentStatus === 'PENDING' && (
            <View style={styles.actionSection}>
              <TouchableOpacity style={styles.primaryActionButton} onPress={handlePay}>
                <View style={styles.primaryActionButtonShadow}>
                  <View style={styles.primaryActionButtonInner}>
                    <LinearGradient colors={['#006C52', '#004D3A']} style={StyleSheet.absoluteFill} />
                    <Text style={styles.actionButtonText}>Pay Now (LKR {parcel.price?.toLocaleString()})</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.paymentWaitText}>Traveler is waiting for payment confirmation.</Text>
            </View>
          )}

          {/* Traveler Lifecycle Actions */}
          {isTraveler && (
            <View style={styles.actionSection}>
              {actionLoading ? (
                <TouchableOpacity style={[styles.primaryActionButton, { opacity: 0.7 }]} disabled>
                    <View style={styles.primaryActionButtonShadow}>
                      <View style={styles.primaryActionButtonInner}>
                        <LinearGradient colors={['#006C52', '#004D3A']} style={StyleSheet.absoluteFill} />
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    </View>
                </TouchableOpacity>
              ) : (
                <>
                  {parcel.status === 'MATCHED' && (
                    <TouchableOpacity style={styles.primaryActionButton} onPress={handleInitiatePickup}>
                    <View style={styles.primaryActionButtonShadow}>
                      <View style={styles.primaryActionButtonInner}>
                        <LinearGradient colors={['#006C52', '#004D3A']} style={StyleSheet.absoluteFill} />
                        <Text style={styles.actionButtonText}>Confirm Pickup</Text>
                      </View>
                    </View>
                    </TouchableOpacity>
                  )}
                  {parcel.status === 'PICKED_UP' && (
                    <TouchableOpacity style={styles.primaryActionButton} onPress={handleInitiateDelivery}>
                    <View style={styles.primaryActionButtonShadow}>
                      <View style={styles.primaryActionButtonInner}>
                        <LinearGradient colors={['#006C52', '#004D3A']} style={StyleSheet.absoluteFill} />
                        <Text style={styles.actionButtonText}>Complete Delivery</Text>
                      </View>
                    </View>
                    </TouchableOpacity>
                  )}
                </>
              )}
              {parcel.status === 'DELIVERED' && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>Delivered Successfully</Text>
                </View>
              )}
              
              {/* Cash Warnings */}
              {parcel.paymentMethod === 'CASH_ON_PICKUP' && parcel.status === 'MATCHED' && (
                <View style={styles.cashWarningCard}>
                   <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                     <Circle cx="12" cy="12" r="10" />
                     <Path d="M12 8v4M12 16h.01" />
                   </Svg>
                   <Text style={styles.cashWarningText}>Collect LKR {parcel.price?.toLocaleString()} from Sender.</Text>
                </View>
              )}
              {parcel.paymentMethod === 'CASH_ON_DELIVERY' && parcel.status === 'PICKED_UP' && (
                <View style={styles.cashWarningCard}>
                   <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                     <Circle cx="12" cy="12" r="10" />
                     <Path d="M12 8v4M12 16h.01" />
                   </Svg>
                   <Text style={styles.cashWarningText}>Collect LKR {parcel.price?.toLocaleString()} from Receiver.</Text>
                </View>
              )}
            </View>
          )}

          {/* Match Request List */}
          {(isSender || (user?.roleActive === 'TRAVELER' && parcel.matches?.some((m: any) => m.travelerId === user?.id && m.status === 'PENDING'))) && statusUpper === 'PENDING' && parcel.matches?.length > 0 && (
            <View style={[styles.sectionCard, { marginTop: 24 }]}>
              <Text style={styles.sectionLabel}>MATCH REQUESTS</Text>
              
              {parcel.matches
                .filter((m: any) => m.status === 'PENDING' && (isSender || m.travelerId === user?.id))
                .map((match: any) => (
                <View key={match.id} style={styles.matchRequestItem}>
                  <View style={styles.travelerInfo}>
                    <View style={styles.travelerAvatar}>
                      <Text style={styles.avatarLetter}>
                        {(isSender ? match.traveler?.name : match.sender?.name)?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.travelerName}>
                        {isSender ? match.traveler?.name : match.sender?.name}
                      </Text>
                      <Text style={styles.tripDateValue}>{dayjs(match.trip?.travelDate).format('MMM DD')} • {match.trip?.travelTime || 'Anytime'}</Text>
                    </View>
                  </View>
                  
                  {/* Customer (Sender) view logic */}
                  {isSender && match.requestedBy === 'TRAVELER' && (
                    <View style={styles.requestActions}>
                      <TouchableOpacity style={[styles.actionButton, styles.rejectBtn]} onPress={() => handleRejectMatch(match.id)}>
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, styles.acceptBtn]} onPress={() => handleAcceptMatch(match.id)}>
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Traveler view logic */}
                  {!isSender && match.travelerId === user?.id && match.requestedBy === 'CUSTOMER' && (
                    <View style={styles.requestActions}>
                      <TouchableOpacity style={[styles.actionButton, styles.rejectBtn]} onPress={() => handleRejectMatch(match.id)}>
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, styles.acceptBtn]} onPress={() => handleAcceptMatch(match.id)}>
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Matched Info Cards - Show Traveler to Sender */}
          {isSender && isMatchedState && parcel.matchedTrip && (
            <View style={[styles.sectionCard, styles.matchedCard]}>
              <View style={styles.matchedHeader}>
                <Text style={styles.matchedLabelText}>MATCHED TRAVELER</Text>
              </View>
              <View style={styles.travelerProfileRow}>
                <View style={styles.largeAvatar}>
                   {parcel.matchedTrip.traveler?.selfieUrl ? (
                     <Image source={{ uri: parcel.matchedTrip.traveler.selfieUrl }} style={styles.avatarImg} />
                   ) : (
                     <Text style={styles.largeAvatarLetter}>{parcel.matchedTrip.traveler?.name?.charAt(0).toUpperCase()}</Text>
                   )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.travelerNameLarge}>{parcel.matchedTrip.traveler?.name}</Text>
                  <Text style={styles.travelerContact}>{parcel.matchedTrip.traveler?.phone}</Text>
                </View>
                {parcel.matchedTrip.traveler?.phone && (
                  <TouchableOpacity 
                    style={styles.callButton} 
                    activeOpacity={0.7}
                    onPress={() => handleCall(parcel.matchedTrip.traveler?.phone)}
                  >
                     <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
                      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-2.11a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>

              {parcel.status === 'DELIVERED' && !parcel.reviews?.some((r: any) => r.reviewerId === user?.id) && (
                <TouchableOpacity 
                  style={[styles.primaryActionButton, { marginTop: 16 }]} 
                  onPress={() => {
                    setRatingConfig({
                      title: 'Rate your Traveler',
                      subtitle: `How was your experience with ${parcel.matchedTrip.traveler?.name}?`,
                      revieweeId: parcel.matchedTrip.traveler?.id
                    });
                    setRatingModalVisible(true);
                  }}
                >
                  <View style={styles.primaryActionButtonShadow}>
                    <View style={styles.primaryActionButtonInner}>
                      <LinearGradient colors={['#10B981', '#059669']} style={StyleSheet.absoluteFill} />
                      {ratingSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.actionButtonText}>Rate Traveler ⭐</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {parcel.status === 'DELIVERED' && parcel.reviews?.some((r: any) => r.reviewerId === user?.id) && (
                <View style={[styles.completedBadge, { marginTop: 16, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#F59E0B' }]}>
                  <Text style={[styles.completedText, { color: '#F59E0B', fontSize: 13 }]}>Rating Submitted ⭐</Text>
                </View>
              )}
            </View>
          )}

          {/* Matched Info Cards - Show Sender to Traveler */}
          {isTraveler && isMatchedState && (
            <View style={[styles.sectionCard, styles.matchedCard, { borderColor: '#10B981' }]}>
              <View style={styles.matchedHeader}>
                <Text style={[styles.matchedLabelText, { color: '#10B981' }]}>PARCEL OWNER</Text>
              </View>
              <View style={styles.travelerProfileRow}>
                <View style={[styles.largeAvatar, { borderColor: '#10B981' }]}>
                   {parcel.sender?.selfieUrl ? (
                      <Image source={{ uri: parcel.sender.selfieUrl }} style={styles.avatarImg} />
                   ) : (
                      <Text style={[styles.largeAvatarLetter, { color: '#10B981' }]}>{parcel.sender?.name?.charAt(0).toUpperCase()}</Text>
                   )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.travelerNameLarge}>{parcel.sender?.name}</Text>
                  <Text style={styles.travelerContact}>{parcel.sender?.phone || 'Contact number available'}</Text>
                </View>
                {parcel.sender?.phone && (
                   <TouchableOpacity 
                      style={styles.callButton} 
                      activeOpacity={0.7}
                      onPress={() => handleCall(parcel.sender?.phone)}
                   >
                      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
                         <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.11-2.11a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </Svg>
                   </TouchableOpacity>
                )}
              </View>

              {parcel.status === 'DELIVERED' && !parcel.reviews?.some((r: any) => r.reviewerId === user?.id) && (
                <TouchableOpacity 
                  style={[styles.primaryActionButton, { marginTop: 16 }]} 
                  onPress={() => {
                    setRatingConfig({
                      title: 'Rate the Sender',
                      subtitle: `How was your experience with ${parcel.sender?.name}?`,
                      revieweeId: parcel.senderId
                    });
                    setRatingModalVisible(true);
                  }}
                >
                  <View style={styles.primaryActionButtonShadow}>
                    <View style={styles.primaryActionButtonInner}>
                      <LinearGradient colors={['#10B981', '#059669']} style={StyleSheet.absoluteFill} />
                      {ratingSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.actionButtonText}>Rate Sender ⭐</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {parcel.status === 'DELIVERED' && parcel.reviews?.some((r: any) => r.reviewerId === user?.id) && (
                <View style={[styles.completedBadge, { marginTop: 16, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#10B981' }]}>
                  <Text style={[styles.completedText, { color: '#10B981', fontSize: 13 }]}>Rating Submitted ⭐</Text>
                </View>
              )}
            </View>
          )}

        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* OTP MODAL */}
      <Modal visible={otpModalVisible} transparent animationType="fade" onRequestClose={() => setOtpModalVisible(false)}>
        <View style={styles.otpOverlay}>
          <View style={styles.otpContent}>
            <Text style={styles.otpTitle}>Verify {otpType === 'PICKUP' ? 'Pickup' : 'Delivery'}</Text>
            <Text style={styles.otpSubtitle}>Enter the 6-digit code provided by the {otpType === 'PICKUP' ? 'sender' : 'receiver'}.</Text>
            
            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={theme.text.tertiary}
              />
            </View>

            <View style={styles.otpActions}>
              <TouchableOpacity 
                style={[styles.otpCancelBtn, processingOtp && { opacity: 0.5 }]} 
                onPress={() => setOtpModalVisible(false)}
                disabled={processingOtp}
              >
                <Text style={styles.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.otpConfirmBtn} onPress={handleVerifyOtp} disabled={processingOtp}>
                {processingOtp ? <ActivityIndicator color="#FFF" /> : <Text style={styles.otpConfirmText}>Verify Code</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        theme={theme}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      <RatingModal
        visible={ratingModalVisible}
        title={ratingConfig.title}
        subtitle={ratingConfig.subtitle}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRateSubmit}
      />

      {/* TRIP SELECTION MODAL */}
      <Modal
        visible={isTripModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTripModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Trip</Text>
              <TouchableOpacity onPress={() => setIsTripModalVisible(false)}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.text.primary} strokeWidth="2">
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Which trip will you use to carry this parcel?</Text>
            
            <FlatList
              data={myTrips}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.tripItem}
                  onPress={() => submitMatchRequest(item.id)}
                >
                  <View style={styles.tripItemHeader}>
                    <Text style={styles.tripDate}>{dayjs(item.travelDate).format('MMM DD, YYYY')}</Text>
                    <View style={styles.tripStatus}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusTextSmall}>ACTIVE</Text>
                    </View>
                  </View>
                  <Text style={styles.tripRoute}>{item.fromLocation} → {item.toLocation}</Text>
                  <Text style={styles.tripCapacity}>Remaining: {item.capacity - (item.usedCapacity || 0)} Kg</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyTrips}>
                  <Text style={styles.emptyText}>No active trips found.</Text>
                </View>
              }
            />

            {requestingMatch && (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={theme.primary} />
                <Text style={styles.loadingText}>Sending Request...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Full Screen Image Slider Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.fullScreenOverlay}>
          <SafeAreaView style={styles.modalHeaderClose}>
             <TouchableOpacity 
               style={styles.closeModalBtn} 
               onPress={() => setIsModalVisible(false)}
             >
               <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                 <Path d="M18 6L6 18M6 6l12 12" />
               </Svg>
             </TouchableOpacity>
          </SafeAreaView>

          <FlatList
            data={parcel.imageUrls}
            horizontal
            pagingEnabled
            initialScrollIndex={activeImage}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.fullScreenImageWrapper}>
                <Image 
                  source={{ uri: item }} 
                  style={styles.fullScreenImage} 
                  resizeMode="contain" 
                />
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
          />

          <View style={styles.fullScreenDots}>
            {parcel.imageUrls?.map((_: any, i: number) => (
              <View 
                key={i} 
                style={[
                  styles.fullScreenDot, 
                  activeImage === i && styles.fullScreenActiveDot
                ]} 
              />
            ))}
          </View>
        </View>
      </Modal>

    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  scrollContent: { paddingBottom: 40 },
  imageContainer: {
    width: width,
    height: width * 0.85,
    position: 'relative',
    backgroundColor: theme.surface,
  },
  mainImage: { width: width, height: width * 0.85 },
  noImageContainer: {
    width: width,
    height: width * 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
  },
  noImageText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
  },
  absHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  sliderBtn: {
    position: 'absolute',
    top: '50%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -18,
  },
  leftSliderBtn: { left: 16 },
  rightSliderBtn: { right: 16 },
  dotsContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 8, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 16, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, marginTop: 24 },
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  parcelName: { fontSize: 24, color: theme.text.primary, fontFamily: Typography.extraBold },
  parcelId: { fontSize: 13, color: theme.text.tertiary, marginTop: 4, fontFamily: Typography.bold },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontFamily: Typography.bold, textTransform: 'uppercase' },
  cardSeparator: { height: 1, backgroundColor: theme.border, marginVertical: 24 },
  sectionCard: {
    backgroundColor: theme.card,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  sectionLabel: { fontSize: 11, color: theme.text.tertiary, fontFamily: Typography.extraBold, letterSpacing: 1, marginBottom: 16 },
  routeBox: { flexDirection: 'row', gap: 16 },
  routeLineCenter: { alignItems: 'center', width: 20, paddingVertical: 5 },
  routeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },
  routeDotOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.primary },
  routeDashed: { width: 1, flex: 1, backgroundColor: theme.border, marginVertical: 4 },
  routeTexts: { flex: 1 },
  locLabel: { fontSize: 9, color: theme.text.tertiary, fontFamily: Typography.bold, marginBottom: 2 },
  locValue: { fontSize: 15, color: theme.text.primary, fontFamily: Typography.bold },
  dualCards: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  infoCard: { flex: 1, backgroundColor: theme.card, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  personName: { fontSize: 15, color: theme.text.primary, fontFamily: Typography.bold },
  personPhone: { fontSize: 13, color: theme.text.secondary, marginTop: 2, fontFamily: Typography.bold },
  hiddenInfo: { fontSize: 12, color: theme.text.tertiary, fontStyle: 'italic' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  gridItem: { flex: 1, minWidth: 100, backgroundColor: theme.card, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  gridItemFull: { backgroundColor: theme.card, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  gridLabel: { fontSize: 9, color: theme.text.tertiary, fontFamily: Typography.extraBold, marginBottom: 4 },
  gridValue: { fontSize: 14, color: theme.text.primary, fontFamily: Typography.bold },
  descText: { fontSize: 14, color: theme.text.secondary, lineHeight: 20 },
  noteCard: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFBEB', borderColor: theme.isDark ? theme.border : '#FEF3C7' },
  noteText: { fontSize: 14, color: theme.text.primary, fontFamily: Typography.medium, fontStyle: 'italic' },
  priceCardContainer: {
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: theme.isDark ? '#0D1F18' : '#004D3A', // iOS shadow requirement
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  priceCard: { borderRadius: 24, overflow: 'hidden' },
  priceGradient: { padding: 24 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: Typography.bold },
  priceValue: { fontSize: 24, color: '#FFFFFF', fontFamily: Typography.extraBold, marginTop: 4 },
  paymentBadge: { alignItems: 'flex-end' },
  paymentMethodText: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontFamily: Typography.bold },
  paymentStatusText: { fontSize: 14, fontFamily: Typography.extraBold, marginTop: 2 },
  priceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  priceSubRows: { gap: 10 },
  pSubRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pSubLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  pSubValue: { fontSize: 12, color: '#FFFFFF', fontFamily: Typography.bold },
  actionSection: { gap: 16, marginBottom: 40 },
  primaryActionButton: { borderRadius: 18, height: 60 },
  primaryActionButtonShadow: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#004D3A', // iOS shadow requirement
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionButtonInner: {
    flex: 1,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: Typography.extraBold },
  paymentWaitText: { fontSize: 12, color: theme.text.tertiary, textAlign: 'center', marginTop: 4 },
  cashWarningCard: { flexDirection: 'row', padding: 16, backgroundColor: theme.isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB', borderRadius: 16, gap: 12, alignItems: 'center' },
  cashWarningText: { flex: 1, fontSize: 13, color: '#F59E0B', fontFamily: Typography.medium },
  completedBadge: { padding: 18, backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#DCFBEB', borderRadius: 18, alignItems: 'center' },
  completedText: { color: '#10B981', fontSize: 16, fontFamily: Typography.extraBold },
  matchRequestItem: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  travelerInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  travelerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 18, color: theme.primary, fontFamily: Typography.bold },
  travelerName: { fontSize: 15, color: theme.text.primary, fontFamily: Typography.bold },
  tripDateValue: { fontSize: 12, color: theme.text.secondary, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EF4444' },
  rejectBtnText: { color: '#EF4444', fontFamily: Typography.bold },
  acceptBtn: { backgroundColor: theme.primary },
  acceptBtnText: { color: '#FFFFFF', fontFamily: Typography.bold },
  matchedCard: { backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.05)' : '#F0FDF4', borderColor: '#10B981' },
  matchedLabelText: { fontSize: 11, color: '#10B981', fontFamily: Typography.extraBold },
  travelerProfileRow: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 16 },
  largeAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  largeAvatarLetter: { fontSize: 24, color: theme.primary, fontFamily: Typography.extraBold },
  travelerNameLarge: { fontSize: 18, color: theme.text.primary, fontFamily: Typography.extraBold },
  travelerContact: { fontSize: 14, color: theme.text.secondary, marginTop: 2,fontFamily:Typography.bold },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  otpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  otpContent: { width: '100%', backgroundColor: theme.card, borderRadius: 32, padding: 32, alignItems: 'center' },
  otpTitle: { fontSize: 22, color: theme.text.primary, fontFamily: Typography.extraBold },
  otpSubtitle: { fontSize: 14, color: theme.text.secondary, textAlign: 'center', marginVertical: 12 },
  otpInputContainer: { width: '100%', marginVertical: 24 },
  otpInput: { height: 72, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: theme.border, fontSize: 32, color: theme.text.primary, textAlign: 'center', letterSpacing: 8, fontFamily: Typography.extraBold },
  otpActions: { flexDirection: 'row', gap: 12, width: '100%' },
  otpCancelBtn: { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  otpCancelText: { color: theme.text.secondary, fontFamily: Typography.bold },
  otpConfirmBtn: { flex: 2, height: 56, borderRadius: 16, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  otpConfirmText: { color: '#FFFFFF', fontFamily: Typography.extraBold },
  matchedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fullScreenOverlay: { flex: 1, backgroundColor: '#000000' },
  modalHeaderClose: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 20 },
  closeModalBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  fullScreenImageWrapper: { width: width, height: '100%', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: width, height: '100%' },
  fullScreenDots: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  fullScreenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  fullScreenActiveDot: { width: 20, backgroundColor: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, color: theme.text.primary, fontFamily: Typography.extraBold },
  modalSubtitle: { fontSize: 14, color: theme.text.secondary, marginBottom: 24, fontFamily: Typography.medium },
  tripItem: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', padding: 20, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  tripItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tripDate: { fontSize: 15, color: theme.text.primary, fontFamily: Typography.bold },
  tripStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#DCFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusTextSmall: { fontSize: 10, color: '#10B981', fontFamily: Typography.extraBold },
  tripRoute: { fontSize: 14, color: theme.text.secondary, fontFamily: Typography.medium },
  tripCapacity: { fontSize: 12, color: theme.text.tertiary, marginTop: 4, fontFamily: Typography.bold },
  emptyTrips: { padding: 40, alignItems: 'center' },
  emptyText: { color: theme.text.tertiary, fontFamily: Typography.medium },
  modalLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderRadius: 32 },
  loadingText: { color: '#FFFFFF', marginTop: 12, fontFamily: Typography.bold },
  requestedStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', borderRadius: 12, alignSelf: 'center' },
  requestedStatusText: { color: '#3B82F6', fontSize: 13, fontFamily: Typography.bold },
});

export default ParcelDetailsScreen;
