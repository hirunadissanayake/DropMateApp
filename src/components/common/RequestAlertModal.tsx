import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../../constants/Typography';

const { width, height } = Dimensions.get('window');

// 15 minutes in seconds
const EXPIRY_SECONDS = 15 * 60;

const DECLINE_REASONS = [
  { label: 'Item is too heavy', value: 'too_heavy' },
  { label: 'Incorrect route/destination', value: 'wrong_route' },
  { label: 'Time not convenient', value: 'not_available' },
  { label: 'Safety or security concerns', value: 'suspicious' },
  { label: 'Vehicle capacity full', value: 'overloaded' },
  { label: 'Other reasons', value: 'other' },
];

export interface RequestAlertData {
  matchId: string;
  parcelPhotos?: string[];
  parcelTitle?: string;
  parcelWeight?: string;
  fromLocation?: string;
  toLocation?: string;
  senderName?: string;
  offerPrice?: string;
  remainingSeconds?: number;
}

interface RequestAlertModalProps {
  visible: boolean;
  data: RequestAlertData | null;
  onAccept: (matchId: string) => Promise<void>;
  onDecline: (matchId: string, reason: string) => Promise<void>;
  onExpire: (matchId: string) => void;
}

const RequestAlertModal: React.FC<RequestAlertModalProps> = ({
  visible,
  data,
  onAccept,
  onDecline,
  onExpire,
}) => {
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations logic
  useEffect(() => {
    if (visible && data) {
      // Use the remaining time from the server if available
      setTimeLeft(data.remainingSeconds ?? EXPIRY_SECONDS);
      setIsAccepting(false);
      setIsDeclining(false);
      setShowReasonModal(false);
      setShowGallery(false);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 120,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            if (data?.matchId) onExpire(data.matchId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current!);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    return () => clearInterval(timerRef.current!);
  }, [visible]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAccept = async () => {
    if (!data) return;
    setIsAccepting(true);
    try {
      await onAccept(data.matchId);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleConfirmDecline = async (reason: string) => {
    if (!data) return;
    setIsDeclining(true);
    try {
      await onDecline(data.matchId, reason);
      setShowReasonModal(false);
    } finally {
      setIsDeclining(false);
    }
  };

  const timerProgress = timeLeft / EXPIRY_SECONDS;
  const isUrgent = timeLeft <= 60;

  if (!visible && !data) return null;

  return (
    <>
      <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
        <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
          <Animated.View style={[styles.mainSheet, { transform: [{ translateY: slideAnim }] }]}>
            {/* Grabber */}
            <View style={styles.grabberContainer}>
              <View style={styles.grabber} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Header Status */}
              <View style={styles.bannerRow}>
                <View style={[styles.timerPill, isUrgent && styles.timerUrgent]}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isUrgent ? '#FF4D4D' : '#00C897'} strokeWidth="2.5">
                    <Circle cx="12" cy="12" r="10" />
                    <Path d="M12 6v6l4 2" />
                  </Svg>
                  <Text style={[styles.timerText, isUrgent && styles.textUrgent]}>{formatTime(timeLeft)}</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>NEW DELIVERY</Text>
                </View>
              </View>

              <Text style={styles.heading}>New Request!</Text>
              <Text style={styles.subHeading}>You have a new delivery opportunity. Check the details and respond.</Text>

              {/* Single Image Card (Click to Expand) */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.imageSection} 
                onPress={() => setShowGallery(true)}
              >
                {data?.parcelPhotos && data.parcelPhotos.length > 0 ? (
                  <>
                    <Image source={{ uri: data.parcelPhotos[0] }} style={styles.parcelImage} resizeMode="cover" />
                    {data.parcelPhotos.length > 1 && (
                      <View style={styles.imageCountBadge}>
                        <Text style={styles.imageCountText}>+{data.parcelPhotos.length - 1} more</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                      <Path d="M20 12v10H4V12M2 7h20v5H2V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </Svg>
                    <Text style={styles.placeholderText}>No Parcel Images</Text>
                  </View>
                )}
                <View style={styles.parcelNameOverlay}>
                  <Text style={styles.parcelNameText} numberOfLines={1}>{data?.parcelTitle || 'Unnamed Parcel'}</Text>
                </View>
                {data?.parcelPhotos && data.parcelPhotos.length > 0 && (
                  <View style={styles.expandIcon}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
                      <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </Svg>
                  </View>
                )}
              </TouchableOpacity>

              {/* Details Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>WEIGHT</Text>
                  <Text style={styles.infoValue}>{data?.parcelWeight || 'N/A'}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>EARNINGS</Text>
                  <Text style={styles.infoPrice}>LKR {data?.offerPrice || '0'}</Text>
                </View>
              </View>

              {/* Route Design */}
              <View style={styles.routeCard}>
                <View style={styles.routeLineContainer}>
                  <View style={styles.dotStart} />
                  <View style={styles.dashedLine} />
                  <View style={styles.dotEnd} />
                </View>
                <View style={styles.routeTextContainer}>
                  <View style={styles.routePoint}>
                    <Text style={styles.routeLabel}>PICKUP FROM</Text>
                    <Text style={styles.routeCity}>{data?.fromLocation || 'Unknown'}</Text>
                  </View>
                  <View style={[styles.routePoint, { marginTop: 20 }]}>
                    <Text style={styles.routeLabel}>DROP-OFF TO</Text>
                    <Text style={styles.routeCity}>{data?.toLocation || 'Unknown'}</Text>
                  </View>
                </View>
              </View>

              {/* Sender Profile */}
              <View style={styles.senderSection}>
                <View style={styles.avatarPill}>
                  <Text style={styles.avatarChar}>{data?.senderName?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
                <View style={styles.senderMeta}>
                  <Text style={styles.senderName}>{data?.senderName || 'DropMate User'}</Text>
                  <View style={styles.verifiedRow}>
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="#006C52">
                      <Path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z"/>
                    </Svg>
                    <Text style={styles.verifiedText}>Verified Sender</Text>
                  </View>
                </View>
              </View>

              {/* Interaction Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.declineBtn} 
                  onPress={() => setShowReasonModal(true)}
                >
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.acceptBtn} 
                  onPress={handleAccept}
                  disabled={isAccepting}
                >
                  <LinearGradient colors={['#006C52', '#004D3B']} style={styles.acceptGrad}>
                    {isAccepting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.acceptBtnText}>Accept Request</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.expiryNote}>This request will expire in {formatTime(timeLeft)}</Text>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Decline Reason Modal */}
      <Modal transparent visible={showReasonModal} animationType="fade">
        <View style={styles.reasonOverlay}>
          <View style={styles.reasonSheet}>
            <View style={styles.reasonHeader}>
              <Text style={styles.reasonTitle}>Select a Reason</Text>
              <TouchableOpacity onPress={() => setShowReasonModal(false)}>
                <Text style={styles.reasonClose}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.reasonList}>
              {DECLINE_REASONS.map((r) => (
                <TouchableOpacity 
                  key={r.value} 
                  style={styles.reasonItem}
                  onPress={() => handleConfirmDecline(r.label)}
                >
                  <Text style={styles.reasonItemText}>{r.label}</Text>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
              ))}
            </View>
            
            {isDeclining && (
              <View style={styles.loadingOver}>
                <ActivityIndicator size="large" color="#006C52" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Image Gallery Modal */}
      <Modal visible={showGallery} transparent animationType="fade">
        <View style={styles.galleryOverlay}>
          <TouchableOpacity 
            style={styles.galleryClose} 
            onPress={() => setShowGallery(false)}
          >
            <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
              <Path d="M18 6L6 18M6 6l12 12" />
            </Svg>
          </TouchableOpacity>
          
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroll}
          >
            {data?.parcelPhotos?.map((url, index) => (
              <View key={index} style={styles.galleryItem}>
                <Image 
                  source={{ uri: url }} 
                  style={styles.galleryImage} 
                  resizeMode="contain" 
                />
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.galleryFooter}>
            <Text style={styles.galleryFooterText}>Tap anywhere to close gallery</Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  mainSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    maxHeight: height * 0.92,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 6,
  },
  timerUrgent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  timerText: {
    fontFamily: Typography.bold,
    fontSize: 14,
    color: '#008F6C',
  },
  textUrgent: {
    color: '#FF4D4D',
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontFamily: Typography.bold,
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.8,
  },
  heading: {
    fontFamily: Typography.bold,
    fontSize: 28,
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subHeading: {
    fontFamily: Typography.medium,
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
  },
  imageSection: {
    width: '100%',
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  parcelImage: {
    width: '100%',
    height: '100%',
  },
  expandIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 12,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
  },
  imageCountText: {
    fontFamily: Typography.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  placeholderText: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: '#94A3B8',
  },
  parcelNameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  parcelNameText: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoLabel: {
    fontFamily: Typography.bold,
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  infoValue: {
    fontFamily: Typography.bold,
    fontSize: 20,
    color: '#1E293B',
  },
  infoPrice: {
    fontFamily: Typography.bold,
    fontSize: 20,
    color: '#006C52',
  },
  routeCard: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  routeLineContainer: {
    width: 24,
    alignItems: 'center',
    paddingTop: 8,
  },
  dotStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C897',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#00C897',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  dashedLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  dotEnd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  routeTextContainer: {
    flex: 1,
    marginLeft: 18,
  },
  routePoint: {},
  routeLabel: {
    fontFamily: Typography.bold,
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  routeCity: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: '#0F172A',
  },
  senderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  avatarPill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  avatarChar: {
    fontFamily: Typography.bold,
    fontSize: 22,
    color: '#006C52',
  },
  senderMeta: {
    flex: 1,
  },
  senderName: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: '#1E293B',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedText: {
    fontFamily: Typography.semiBold,
    fontSize: 12,
    color: '#64748B',
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
  },
  declineBtn: {
    flex: 1,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtnText: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: '#64748B',
  },
  acceptBtn: {
    flex: 1.6,
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    fontFamily: Typography.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  expiryNote: {
    textAlign: 'center',
    fontFamily: Typography.semiBold,
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 20,
  },
  // REASON STYLES
  reasonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  reasonSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
  },
  reasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  reasonTitle: {
    fontFamily: Typography.bold,
    fontSize: 22,
    color: '#0F172A',
  },
  reasonClose: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: '#64748B',
  },
  reasonList: {
    gap: 10,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reasonItemText: {
    fontFamily: Typography.semiBold,
    fontSize: 15,
    color: '#334155',
  },
  loadingOver: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // GALLERY STYLES
  galleryOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  galleryClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    zIndex: 100,
    padding: 10,
  },
  galleryScroll: {
    flex: 1,
  },
  galleryItem: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: width,
    height: height * 0.7,
  },
  galleryFooter: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  galleryFooterText: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default RequestAlertModal;
