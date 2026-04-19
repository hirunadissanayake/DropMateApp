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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../components/common/BackButton';
import { useAuthStore } from '../store/authStore';
import * as parcelService from '../services/parcelService';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';

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
    }
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>SENDER</Text>
              <Text style={styles.personName}>{parcel.sender?.name}</Text>
              {parcel.sender?.phone ? (
                <Text style={styles.personPhone}>{parcel.sender?.phone}</Text>
              ) : (
                <Text style={styles.hiddenInfo}>Contact hidden until matched</Text>
              )}
            </View>
          </View>

          {/* Action Button for Travelers */}
          {user?.roleActive === 'TRAVELER' && parcel.status === 'PENDING' && (
            <TouchableOpacity 
              style={styles.matchButton}
              onPress={() => {
                // TODO: Show trip selection modal and request match
                Alert.alert('Coming Soon', 'Matching logic will be implemented in the next step!');
              }}
            >
              <LinearGradient
                colors={['#006C52', '#004D3A']}
                style={styles.matchGradient}
              >
                <Text style={styles.matchButtonText}>Request to Carry Parcel</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

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

          {/* Pricing Section */}
          <View style={styles.priceCard}>
            <LinearGradient
              colors={['#006C52', '#004D3A']}
              style={styles.priceGradient}
            >
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total Price</Text>
                <Text style={styles.priceValue}>LKR {parcel.price?.toLocaleString()}</Text>
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
    fontFamily: 'Manrope',
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
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  parcelId: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
    fontFamily: 'Manrope',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
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
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 16,
    textTransform: 'uppercase',
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
    fontFamily: 'Manrope',
  },
  locValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Manrope',
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
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Manrope',
  },
  personPhone: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontFamily: 'Manrope',
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
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  descText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    fontFamily: 'Manrope',
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
    fontFamily: 'Manrope',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Manrope',
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
  },
  pSubValue: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
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
    fontWeight: '700',
    fontFamily: 'Manrope',
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
    fontFamily: 'Manrope',
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
    fontWeight: '800',
    fontFamily: 'Manrope-Bold',
    letterSpacing: 0.5,
  },
});

export default ParcelDetailsScreen;
