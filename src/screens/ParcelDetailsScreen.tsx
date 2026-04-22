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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/common/BackButton';
import { useAuthStore } from '../store/authStore';
import * as parcelService from '../services/parcelService';
import * as tripService from '../services/tripService';
import * as deliveryService from '../services/deliveryService';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import CustomAlert from '../components/common/CustomAlert';
import { Typography } from '../constants/Typography';

const { width } = Dimensions.get('window');

const ParcelDetailsScreen = () => {
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
  const [paying, setPaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    fetchDetails();
  }, [parcelId]);

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
      case 'DELIVERED': return '#059669';
      case 'CANCELLED': return '#DC2626';
      case 'IN_TRANSIT': return '#3B82F6';
      default: return '#64748B';
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
      
      // Update local parcel state to show request sent
      setParcel((prev: any) => ({ ...prev, userMatch: response.match }));

      // Delay slightly to allow the trip modal to close before showing success alert
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
          fetchDetails(); // Refresh to show matched status and contact info
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
          fetchDetails(); // Refresh to update the list
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
            fetchDetails();
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
            fetchDetails();
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

  const handlePay = () => {
    navigation.navigate('Payment', { parcelId, amount: parcel.price });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006C52" />
      </View>
    );
  }

  if (!parcel) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#F0FFF8', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#006C52']} 
            tintColor="#006C52"
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
                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                  <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" />
                </Svg>
                <Text style={styles.noImageText}>No Photos Available</Text>
              </View>
            )}
          </ScrollView>
          
          {/* Back Action */}
          <View style={[styles.absHeader, { top: insets.top + 10 }]}>
            <BackButton onPress={() => navigation.goBack()} />
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                <Path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.34832 22 5.8 22H18.2C18.6517 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" />
                <Path d="M16 6L12 2L8 6" />
                <Path d="M12 2V15" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Slider Buttons */}
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
              <Text style={styles.parcelId}>ID : #{parcel.id}</Text>
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

          {/* Sender & Recipient */}
          <View style={styles.dualCards}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>RECEIVER</Text>
              {parcel.receiverName ? (
                <>
                  <Text style={styles.personName}>{parcel.receiverName}</Text>
                  <Text style={styles.personPhone}>{parcel.receiverPhone}</Text>
                </>
              ) : (
                <Text style={styles.hiddenInfo}>Hidden until matched</Text>
              )}
            </View>
            {user?.id !== parcel.senderId && (
              <View style={styles.infoCard}>
                <Text style={styles.sectionLabel}>SENDER</Text>
                <Text style={styles.personName}>{parcel.sender?.name}</Text>
                {parcel.sender?.phone ? (
                  <Text style={styles.personPhone}>{parcel.sender?.phone}</Text>
                ) : (
                  <Text style={styles.hiddenInfo}>Contact hidden until matched</Text>
                )}
              </View>
            )}
          </View>

          {/* Action Button for Travelers - REMOVED per user request (Only Customers can initiate) */}


          {/* Parcel Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>WEIGHT</Text>
              <Text style={styles.gridValue}>{parcel.weight} Kg</Text>
            </View>
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

          {/* Pricing & Payment Section */}
          <View style={styles.priceCard}>
            <LinearGradient
              colors={['#006C52', '#004D3A']}
              style={styles.priceGradient}
            >
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>Total Price</Text>
                  <Text style={styles.priceValue}>LKR {parcel.price?.toLocaleString()}</Text>
                </View>
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentMethodText}>
                    {parcel.paymentMethod === 'ONLINE' ? 'CARD PAYMENT' : parcel.paymentMethod === 'CASH_ON_PICKUP' ? 'CASH ON PICKUP' : 'CASH ON DELIVERY'}
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
                  <Text style={styles.pSubLabel}>Base Delivery Rate</Text>
                  <Text style={styles.pSubValue}>LKR {parcel.travelerPayout?.toLocaleString()}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Customer Payment Action */}
          {user?.id === parcel.senderId && parcel.status === 'MATCHED' && parcel.paymentMethod === 'ONLINE' && parcel.paymentStatus === 'PENDING' && (
            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={styles.primaryActionButton} 
                onPress={handlePay}
              >
                <LinearGradient colors={['#006C52', '#004D3A']} style={styles.actionGradient}>
                  <Text style={styles.actionButtonText}>Pay with Card (LKR {parcel.price?.toLocaleString()})</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.paymentWaitText}>The traveler is waiting for your payment to start the pickup.</Text>
            </View>
          )}

          {/* Delivery Lifecycle Actions */}
          {user?.id === parcel.matchedTrip?.travelerId && (
            <View style={styles.actionSection}>
              {parcel.status === 'MATCHED' && (
                <TouchableOpacity style={styles.primaryActionButton} onPress={handleInitiatePickup}>
                  <LinearGradient colors={['#006C52', '#004D3A']} style={styles.actionGradient}>
                    <Text style={styles.actionButtonText}>Confirm Pickup</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {parcel.status === 'PICKED_UP' && (
                <TouchableOpacity style={styles.primaryActionButton} onPress={handleInitiateDelivery}>
                  <LinearGradient colors={['#006C52', '#004D3A']} style={styles.actionGradient}>
                    <Text style={styles.actionButtonText}>Complete Delivery</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {parcel.status === 'DELIVERED' && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>Delivered Successfully</Text>
                </View>
              )}
              {/* Cash on Pickup warning: show at MATCHED step (before pickup) */}
              {parcel.paymentMethod === 'CASH_ON_PICKUP' && parcel.status === 'MATCHED' && (
                <View style={styles.cashWarningCard}>
                   <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2">
                     <Circle cx="12" cy="12" r="10" />
                     <Path d="M12 8v4M12 16h.01" />
                   </Svg>
                   <Text style={styles.cashWarningText}>Collect LKR {parcel.price?.toLocaleString()} in cash from the SENDER before picking up the parcel.</Text>
                </View>
              )}
              {/* Cash on Delivery warning: show at PICKED_UP step (before delivery) */}
              {parcel.paymentMethod === 'CASH_ON_DELIVERY' && parcel.status === 'PICKED_UP' && (
                <View style={styles.cashWarningCard}>
                   <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2">
                     <Circle cx="12" cy="12" r="10" />
                     <Path d="M12 8v4M12 16h.01" />
                   </Svg>
                   <Text style={styles.cashWarningText}>Collect LKR {parcel.price?.toLocaleString()} in cash from the RECEIVER before handing over the parcel.</Text>
                </View>
              )}
            </View>
          )}

          {/* Incoming Match Requests */}
          {(user?.id === parcel.senderId || (user?.roleActive === 'TRAVELER' && parcel.matches?.some((m: any) => m.travelerId === user?.id && m.status === 'PENDING'))) && parcel.status === 'PENDING' && parcel.matches?.length > 0 && (
            <View style={[styles.sectionCard, { marginTop: 24 }]}>
              <Text style={styles.sectionLabel}>MATCH REQUESTS ({parcel.matches.filter((m: any) => m.status === 'PENDING' && (user?.id === parcel.senderId || m.travelerId === user?.id)).length})</Text>
              <Text style={styles.requestsSubtitle}>
                {user?.id === parcel.senderId ? "Travelers who want to carry your parcel" : "Delivery requests sent to you"}
              </Text>
              
              {parcel.matches
                .filter((m: any) => m.status === 'PENDING' && (user?.id === parcel.senderId || m.travelerId === user?.id))
                .map((match: any) => (
                <View key={match.id} style={styles.matchRequestItem}>
                  <View style={styles.requestHeader}>
                    <View style={styles.travelerInfo}>
                      <View style={[styles.travelerAvatar, user?.id !== parcel.senderId && { backgroundColor: '#E0E7FF' }]}>
                        <Text style={[styles.avatarLetter, user?.id !== parcel.senderId && { color: '#4338CA' }]}>
                          {(user?.id === parcel.senderId ? match.traveler?.name : match.sender?.name)?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.travelerName}>
                          {user?.id === parcel.senderId ? match.traveler?.name : match.sender?.name}
                        </Text>
                        {/* <Text style={styles.travelerRating}>
                          {user?.id === parcel.senderId ? "⭐ Traveler" : "👤 Customer Request"}
                        </Text> */}
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.requestTripInfo}>
                    <Text style={styles.tripDateLabel}>TRAVELING ON</Text>
                    <Text style={styles.tripDateValue}>{dayjs(match.trip?.travelDate).format('dddd, MMM DD')} at {match.trip?.travelTime || 'Anytime'}</Text>
                    <View style={styles.tripRouteRow}>
                       <Text style={styles.tripRouteText}>{match.trip?.fromLocation} → {match.trip?.toLocation}</Text>
                    </View>
                  </View>

                  {user?.id !== parcel.senderId && (
                    <View style={styles.requestActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectBtn]} 
                        onPress={() => handleRejectMatch(match.id)}
                      >
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.acceptBtn]}
                        onPress={() => handleAcceptMatch(match.id)}
                      >
                        <Text style={styles.acceptBtnText}>Accept Request</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Matched Traveler Info for Customer */}
          {user?.id === parcel.senderId && parcel.status === 'MATCHED' && parcel.matchedTrip && (
            <View style={[styles.sectionCard, styles.matchedTravelerCard]}>
              <View style={styles.matchedHeader}>
                <View style={styles.matchedLabelBadge}>
                  <Text style={styles.matchedLabelText}>ACCEPTED TRAVELER</Text>
                </View>
                <View style={styles.statusBadgeMatched}>
                  <Text style={styles.statusTextMatched}>Ready for Delivery</Text>
                </View>
              </View>
              
              <View style={styles.travelerProfileRow}>
                <View style={styles.largeAvatar}>
                   {parcel.matchedTrip.traveler?.selfieUrl ? (
                     <Image source={{ uri: parcel.matchedTrip.traveler.selfieUrl }} style={styles.avatarImg} />
                   ) : (
                     <Text style={styles.largeAvatarLetter}>{parcel.matchedTrip.traveler?.name?.charAt(0).toUpperCase()}</Text>
                   )}
                </View>
                <View style={styles.travelerDetails}>
                  <Text style={styles.travelerNameLarge}>{parcel.matchedTrip.traveler?.name}</Text>
                  <Text style={styles.travelerContact}>{parcel.matchedTrip.traveler?.phone}</Text>
                  <View style={styles.contactActions}>
                    <TouchableOpacity style={styles.contactBtn}>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </Svg>
                      <Text style={styles.contactBtnText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactBtn}>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-13.5 8.38 8.38 0 0 1 3.8.9L21 3z" />
                      </Svg>
                      <Text style={styles.contactBtnText}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Matched Customer Info for Traveler */}
          {user?.id === parcel.matchedTrip?.travelerId && parcel.status === 'MATCHED' && (
            <View style={[styles.sectionCard, styles.matchedCustomerCard]}>
              <View style={styles.matchedHeader}>
                <View style={[styles.matchedLabelBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.matchedLabelText}>PARCEL OWNER</Text>
                </View>
                <View style={[styles.statusBadgeMatched, { backgroundColor: '#DCFBEB' }]}>
                  <Text style={[styles.statusTextMatched, { color: '#059669' }]}>Accepted</Text>
                </View>
              </View>
              
              <View style={styles.travelerProfileRow}>
                <View style={[styles.largeAvatar, { borderColor: '#DCFBEB' }]}>
                   <Text style={[styles.largeAvatarLetter, { color: '#006C52' }]}>{parcel.sender?.name?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.travelerDetails}>
                  <Text style={styles.travelerNameLarge}>{parcel.sender?.name}</Text>
                  <Text style={styles.travelerContact}>{parcel.sender?.phone || 'Phone number available'}</Text>
                  <View style={styles.contactActions}>
                    <TouchableOpacity style={[styles.contactBtn, { borderColor: '#DCFBEB' }]}>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </Svg>
                      <Text style={[styles.contactBtnText, { color: '#006C52' }]}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.contactBtn, { borderColor: '#DCFBEB' }]}>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-13.5 8.38 8.38 0 0 1 3.8.9L21 3z" />
                      </Svg>
                      <Text style={[styles.contactBtnText, { color: '#006C52' }]}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full Screen Image Slider Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeImage + 1} / {parcel.imageUrls?.length}</Text>
              <TouchableOpacity 
                style={styles.closeModalBtn}
                onPress={() => setIsModalVisible(false)}
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
              contentOffset={{ x: activeImage * width, y: 0 }}
              onMomentumScrollEnd={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                setActiveImage(Math.round(x / width));
              }}
            >
              {parcel.imageUrls?.map((url: string, index: number) => (
                <View key={index} style={styles.modalImageWrapper}>
                  <Image 
                    source={{ uri: url }} 
                    style={styles.modalFullImage} 
                    resizeMode="contain" 
                  />
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Trip Selection Modal */}
      <Modal
        visible={isTripModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTripModalVisible(false)}
      >
        <View style={styles.tripModalOverlay}>
          <View style={styles.tripModalContent}>
            <View style={styles.tripModalHeader}>
              <Text style={styles.tripModalTitle}>Select Your Trip</Text>
              <TouchableOpacity onPress={() => setIsTripModalVisible(false)}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.tripModalSubtitle}>Which trip will you use to carry this parcel?</Text>

            <FlatList
              data={myTrips}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.tripList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.tripSelectItem}
                  onPress={() => submitMatchRequest(item.id)}
                  disabled={requestingMatch}
                >
                  <View style={styles.tripItemInfo}>
                    <Text style={styles.tripItemRoute}>{item.fromLocation} → {item.toLocation}</Text>
                    <Text style={styles.tripItemDate}>{dayjs(item.travelDate).format('dddd, MMM DD')}</Text>
                  </View>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
              )}
            />

            {requestingMatch && (
              <View style={styles.tripModalLoading}>
                <ActivityIndicator size="large" color="#006C52" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal
        visible={otpModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.otpOverlay}>
          <View style={styles.otpContent}>
            <Text style={styles.otpTitle}>{otpType === 'PICKUP' ? 'Verify Pickup' : 'Verify Delivery'}</Text>
            <Text style={styles.otpSubtitle}>
              {otpType === 'PICKUP' 
                ? "Enter the 6-digit code provided by the sender." 
                : "Enter the 6-digit code provided by the receiver."}
            </Text>
            
            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
                autoFocus
              />
            </View>

            <View style={styles.otpActions}>
              <TouchableOpacity 
                style={styles.otpCancelBtn} 
                onPress={() => {
                  setOtpModalVisible(false);
                  setOtpCode('');
                }}
              >
                <Text style={styles.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.otpConfirmBtn, otpCode.length < 4 && { opacity: 0.5 }]} 
                onPress={handleVerifyOtp}
                disabled={otpCode.length < 4 || processingOtp}
              >
                {processingOtp ? <ActivityIndicator color="#FFF" /> : <Text style={styles.otpConfirmText}>Verify Code</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* App Theme Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: width,
    height: width * 1.1,
    backgroundColor: '#F1F5F9',
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  mainImage: {
    width: width,
    height: width * 1.1,
    resizeMode: 'cover',
  },
  noImageContainer: {
    width: width,
    height: width * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 12,
    color: '#94A3B8',
    fontFamily: Typography.regular,
  },
  absHeader: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: -30,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  parcelName: {
    fontSize: 24,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  parcelId: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: Typography.regular,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontFamily: Typography.bold,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 0.3,
    marginBottom: 16,
    textTransform: 'uppercase',
    fontFamily: Typography.bold,
  },
  routeBox: {
    flexDirection: 'row',
  },
  routeLineCenter: {
    width: 24,
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006C52',
  },
  routeDashed: {
    width: 1,
    height: 50,
    borderWidth: 0.8,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  routeDotOutline: {
    borderWidth: 2,
    borderColor: '#006C52',
    backgroundColor: '#FFFFFF',
  },
  routeTexts: {
    flex: 1,
    marginLeft: 12,

  },
  locLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 4,
    fontFamily: Typography.regular,
  },
  locValue: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.semiBold,
  },
  dualCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  personName: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  personPhone: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Typography.regular,
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: 4,
    fontFamily: Typography.bold,
  },
  gridValue: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Typography.semiBold,
  },
  descText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    fontFamily: Typography.regular,
  },
  noteCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  noteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#065F46',
    lineHeight: 22,
    fontFamily: Typography.regular,
  },
  priceCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
  },
  priceGradient: {
    padding: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Typography.regular,
  },
  priceValue: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: Typography.bold,
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  priceSubRows: {
    gap: 10,
  },
  pSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pSubLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Typography.regular,
  },
  pSubValue: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Typography.semiBold,
  },
  modalBg: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalContent: {
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
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  closeModalBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageWrapper: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFullImage: {
    width: width,
    height: '100%',
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
  leftSliderBtn: {
    left: 15,
  },
  rightSliderBtn: {
    right: 15,
  },
  hiddenInfo: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
    fontFamily: Typography.regular,
  },
  matchButton: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  matchGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  tripModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  tripModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  tripModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripModalTitle: {
    fontSize: 20,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  tripModalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    fontFamily: Typography.regular,
  },
  tripList: {
    paddingBottom: 20,
  },
  tripSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tripItemInfo: {
    flex: 1,
  },
  tripItemRoute: {
    fontSize: 16,
    fontFamily: Typography.bold,
    color: '#0F172A',
    marginBottom: 4,
  },
  tripItemDate: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.regular,
  },
  tripModalLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  requestsSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    fontFamily: Typography.regular,
  },
  matchRequestItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  travelerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  travelerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  // travelerRating: {
  //   fontSize: 11,
  //   color: '#F59E0B',
  //   fontFamily: Typography.semiBold,
  //   marginTop: 2,
  // },
  requestTripInfo: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  tripDateLabel: {
    fontSize: 9,
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: Typography.bold,
  },
  tripDateValue: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  tripRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tripRouteText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Typography.regular,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontFamily: Typography.bold,
    fontSize: 14,
  },
  acceptBtn: {
    backgroundColor: '#006C52',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontFamily: Typography.bold,
    fontSize: 14,
  },
  matchedTravelerCard: {
    marginTop: 24,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 24,
  },
  matchedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  matchedLabelBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchedLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  statusBadgeMatched: {
    backgroundColor: '#DCFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusTextMatched: {
    color: '#059669',
    fontSize: 11,
    fontFamily: Typography.bold,
  },
  travelerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  largeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  largeAvatarLetter: {
    fontSize: 32,
    fontFamily: Typography.bold,
    color: '#006C52',
  },
  travelerDetails: {
    flex: 1,
  },
  travelerNameLarge: {
    fontSize: 20,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginBottom: 2,
  },
  travelerContact: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 12,
    fontFamily: Typography.regular,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFBEB',
  },
  matchedCustomerCard: {
    marginTop: 24,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 24,
  },
  contactBtnText: {
    fontSize: 13,
    fontFamily: Typography.bold,
    color: '#006C52',
  },
  paymentBadge: {
    alignItems: 'flex-end',
  },
  paymentMethodText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Typography.bold,
    marginBottom: 2,
  },
  paymentStatusText: {
    fontSize: 14,
    fontFamily: Typography.bold,
  },
  actionSection: {
    marginTop: 24,
    gap: 12,
  },
  primaryActionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  actionGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: '#DCFBEB',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  completedText: {
    color: '#059669',
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  paymentWaitText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Typography.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  cashWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  cashWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontFamily: Typography.medium,
  },
  otpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  otpContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: 22,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Typography.regular,
  },
  otpInputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    height: 70,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 32,
    color: '#0F172A',
    fontFamily: Typography.bold,
    textAlign: 'center',
    letterSpacing: 8,
  },
  otpActions: {
    flexDirection: 'row',
    gap: 12,
  },
  otpCancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  otpCancelText: {
    color: '#64748B',
    fontSize: 15,
    fontFamily: Typography.bold,
  },
  otpConfirmBtn: {
    flex: 2,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#006C52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Typography.bold,
  },
});

export default ParcelDetailsScreen;
