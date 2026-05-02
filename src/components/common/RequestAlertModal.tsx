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
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/Colors';

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
  paymentMethod?: string;
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
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations logic
  useEffect(() => {
    if (visible && data) {
      setTimeLeft(data.remainingSeconds ?? EXPIRY_SECONDS);
      setIsAccepting(false);
      setIsDeclining(false);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 28,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 350,
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

      // Pulse animation for urgency
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();

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
      pulseAnim.setValue(1);
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

  const isUrgent = timeLeft <= 60;
  const progressWidth = (timeLeft / EXPIRY_SECONDS) * 100;

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
               {/* Premium Banner */}
               <View style={styles.premiumBanner}>
                 <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.bannerGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                   <View style={styles.bannerContent}>
                     <View style={styles.bannerLeft}>
                        <View style={styles.liveIndicator}>
                           <View style={styles.liveDot} />
                           <Text style={styles.liveText}>NEW OPPORTUNITY</Text>
                        </View>
                        <Text style={styles.mainTitle}>Parcel Match Found!</Text>
                     </View>
                     <Animated.View style={[styles.timerContainer, isUrgent && { transform: [{ scale: pulseAnim }] }]}>
                        <Text style={[styles.timerLabel, isUrgent && styles.urgentText]}>EXPIRES IN</Text>
                        <Text style={[styles.timerValue, isUrgent && styles.urgentText]}>{formatTime(timeLeft)}</Text>
                     </Animated.View>
                   </View>
                   {/* Progress bar */}
                   <View style={styles.progressTrack}>
                      <View style={[styles.progressBar, { width: `${progressWidth}%`, backgroundColor: isUrgent ? '#F87171' : '#FFF' }]} />
                   </View>
                 </LinearGradient>
               </View>

              {/* Immersive Image Section */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.imageSection} 
                onPress={() => setShowGallery(true)}
              >
                {data?.parcelPhotos && data.parcelPhotos.length > 0 ? (
                  <>
                    <Image source={{ uri: data.parcelPhotos[0] }} style={styles.parcelImage} resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imageOverlay} />
                    {data.parcelPhotos.length > 1 && (
                      <View style={styles.imageCountBadge}>
                        <Text style={styles.imageCountText}>+{data.parcelPhotos.length - 1} more</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="1.2">
                      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </Svg>
                    <Text style={styles.placeholderText}>Package Preview Unavailable</Text>
                  </View>
                )}
                
                <View style={styles.parcelInfoFloating}>
                   <Text style={styles.parcelTitleText}>{data?.parcelTitle || 'Unnamed Parcel'}</Text>
                </View>

                {data?.parcelPhotos && data.parcelPhotos.length > 0 && (
                  <View style={styles.expandIcon}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
                      <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </Svg>
                  </View>
                )}
              </TouchableOpacity>

              {/* Stats Bar */}
              <View style={styles.infoGrid}>
                <View style={[styles.infoBox]}>
                  <Text style={styles.infoLabel}>WEIGHT</Text>
                  <Text style={[styles.infoValue, { color: theme.primary }]}>{data?.parcelWeight || 'N/A'}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>PAYMENT</Text>
                  <Text style={styles.infoValue}>
                    {data?.paymentMethod === 'CASH_ON_PICKUP' || data?.paymentMethod === 'cash_pick_up' 
                      ? 'Cash On Pickup' 
                      : data?.paymentMethod === 'CASH_ON_DELIVERY' 
                      ? 'Cash On Delivery' 
                      : 'Online'}
                  </Text>
                </View>
                <View style={[styles.infoBox, { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
                  <Text style={styles.infoLabel}>YOU EARN</Text>
                  <Text style={styles.infoPrice}>LKR {data?.offerPrice || '0'}</Text>
                </View>
              </View>

              {/* Enhanced Route Visualization */}
              <View style={styles.routeSection}>
                 <Text style={styles.sectionLabel}>DELIVERY ROUTE</Text>
                 <View style={styles.routeCard}>
                    <View style={styles.routeVisual}>
                       <View style={styles.nodeTop}>
                          <View style={styles.pulseRing} />
                          <View style={styles.nodeInner} />
                       </View>
                       <View style={styles.nodeLine} />
                       <View style={[styles.nodeBottom, { backgroundColor: '#EF4444' }]} />
                    </View>
                    <View style={styles.routeDetails}>
                       <View style={styles.point}>
                          <Text style={styles.pointLabel}>Pickup</Text>
                          <Text style={styles.pointValue} numberOfLines={1}>{data?.fromLocation || 'Unknown'}</Text>
                       </View>
                       <View style={[styles.point, { marginTop: 20 }]}>
                          <Text style={styles.pointLabel}>Drop-off</Text>
                          <Text style={styles.pointValue} numberOfLines={1}>{data?.toLocation || 'Unknown'}</Text>
                       </View>
                    </View>
                 </View>
              </View>

              {/* Professional Sender Profile */}
              <View style={styles.profileCard}>
                 <View style={styles.avatarPill}>
                    <Text style={styles.avatarChar}>{data?.senderName?.charAt(0).toUpperCase() || 'U'}</Text>
                 </View>
                 <View style={styles.profileMeta}>
                    <View style={styles.nameRow}>
                       <Text style={styles.senderName}>{data?.senderName || 'DropMate User'}</Text>
                       <View style={styles.verifiedBadge}>
                          <Svg width="12" height="12" viewBox="0 0 24 24" fill="#FFF">
                            <Path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z"/>
                          </Svg>
                       </View>
                    </View>
                    <Text style={styles.verifiedText}>Verified Reliable Sender</Text>
                 </View>
              </View>

              {/* Premium Actions */}
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.declineBtn} 
                  onPress={() => setShowReasonModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.acceptBtn} 
                  onPress={handleAccept}
                  disabled={isAccepting}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.acceptGrad}>
                    {isAccepting ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Text style={styles.acceptBtnText}>Confirm Delivery</Text>
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" style={{ marginLeft: 8 }}>
                           <Path d="M5 12h14M12 5l7 7-7 7" />
                        </Svg>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Modern Reason Selection */}
      <Modal transparent visible={showReasonModal} animationType="fade">
        <View style={styles.reasonOverlay}>
          <Animated.View style={styles.reasonSheet}>
            <View style={styles.reasonHeader}>
              <View>
                 <Text style={styles.reasonTitle}>Decline Request</Text>
                 <Text style={styles.reasonSubtitle}>Tell us why you're skipping this match.</Text>
              </View>
              <TouchableOpacity style={styles.closeReasonIcon} onPress={() => setShowReasonModal(false)}>
                 <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2.5">
                    <Path d="M18 6L6 18M6 6l12 12" />
                 </Svg>
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
                </TouchableOpacity>
              ))}
            </View>
            
            {isDeclining && (
              <View style={styles.loadingOver}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Immersive Gallery */}
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
        </View>
      </Modal>
    </>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  mainSheet: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: height * 0.95,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    overflow: 'hidden',
  },
  grabberContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  premiumBanner: {
     borderRadius: 24,
     overflow: 'hidden',
     marginBottom: 20,
     elevation: 5,
     shadowColor: theme.primary,
     shadowOffset: { width: 0, height: 10 },
     shadowOpacity: 0.2,
     shadowRadius: 15,
  },
  bannerGradient: {
     padding: 18,
     paddingTop: 24,
  },
  bannerContent: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 15,
  },
  bannerLeft: {
     flex: 1,
  },
  liveIndicator: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 4,
  },
  liveDot: {
     width: 6,
     height: 6,
     borderRadius: 3,
     backgroundColor: '#FFF',
     marginRight: 6,
  },
  liveText: {
     fontSize: 10,
     fontFamily: Typography.extraBold,
     color: 'rgba(255,255,255,0.85)',
     letterSpacing: 1.5,
  },
  mainTitle: {
     fontSize: 22,
     fontFamily: Typography.bold,
     color: '#FFF',
  },
  timerContainer: {
     alignItems: 'flex-end',
     backgroundColor: 'rgba(0,0,0,0.15)',
     paddingHorizontal: 15,
     paddingVertical: 10,
     borderRadius: 18,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.1)',
  },
  timerLabel: {
     fontSize: 9,
     fontFamily: Typography.extraBold,
     color: 'rgba(255,255,255,0.7)',
     letterSpacing: 1,
  },
  timerValue: {
     fontSize: 20,
     fontFamily: Typography.bold,
     color: '#FFF',
     marginTop: -2,
  },
  urgentText: {
     color: '#FFD1D1',
  },
  progressTrack: {
     height: 3,
     width: '100%',
     backgroundColor: 'rgba(255,255,255,0.15)',
     borderRadius: 2,
     overflow: 'hidden',
  },
  progressBar: {
     height: '100%',
     borderRadius: 2,
  },
  imageSection: {
    width: '100%',
    height: 240,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  parcelImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
     ...StyleSheet.absoluteFillObject,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  imageCountText: {
    fontFamily: Typography.bold,
    fontSize: 12,
    color: '#FFF',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: theme.text.tertiary,
    letterSpacing: -0.2,
  },
  parcelInfoFloating: {
     position: 'absolute',
     bottom: 18,
     left: 20,
     right: 20,
  },
  parcelCategory: {
     backgroundColor: 'rgba(255,255,255,0.15)',
     alignSelf: 'flex-start',
     paddingHorizontal: 10,
     paddingVertical: 4,
     borderRadius: 8,
     marginBottom: 6,
     borderWidth: 0.5,
     borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryText: {
     fontSize: 9,
     fontFamily: Typography.extraBold,
     color: '#FFF',
     letterSpacing: 1,
  },
  parcelTitleText: {
    fontFamily: Typography.bold,
    fontSize: 22,
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 24,
  },
  infoBox: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: Typography.extraBold,
    fontSize: 9,
    color: theme.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: theme.text.primary,
  },
  infoPrice: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: theme.primary,
  },
  routeSection: {
     marginBottom: 24,
  },
  sectionLabel: {
     fontSize: 11,
     fontFamily: Typography.extraBold,
     color: theme.text.tertiary,
     letterSpacing: 1.5,
     marginBottom: 12,
     marginLeft: 4,
  },
  routeCard: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: theme.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  routeVisual: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  nodeTop: {
     position: 'relative',
     alignItems: 'center',
     justifyContent: 'center',
  },
  pulseRing: {
     position: 'absolute',
     width: 24,
     height: 24,
     borderRadius: 12,
     backgroundColor: 'rgba(0, 200, 151, 0.2)',
  },
  nodeInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C897',
    borderWidth: 3,
    borderColor: theme.card,
  },
  nodeLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.border,
    marginVertical: 4,
    borderRadius: 1,
  },
  nodeBottom: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: theme.card,
  },
  routeDetails: {
    flex: 1,
    marginLeft: 20,
  },
  point: {},
  pointLabel: {
    fontFamily: Typography.bold,
    fontSize: 10,
    color: theme.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pointValue: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: theme.text.primary,
    letterSpacing: -0.3,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 32,
  },
  avatarPill: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(61, 217, 164, 0.2)' : '#DCFCE7',
  },
  avatarChar: {
    fontFamily: Typography.bold,
    fontSize: 22,
    color: theme.primary,
  },
  profileMeta: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 6,
  },
  senderName: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: theme.text.primary,
  },
  verifiedBadge: {
     backgroundColor: theme.primary,
     width: 16,
     height: 16,
     borderRadius: 8,
     alignItems: 'center',
     justifyContent: 'center',
  },
  verifiedText: {
    fontFamily: Typography.semiBold,
    fontSize: 13,
    color: theme.text.tertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  declineBtn: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtnText: {
    fontFamily: Typography.bold,
    fontSize: 16,
    color: theme.text.secondary,
  },
  acceptBtn: {
    flex: 1.8,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  acceptGrad: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  acceptBtnText: {
    fontFamily: Typography.bold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  disclaimerText: {
    textAlign: 'center',
    fontFamily: Typography.medium,
    fontSize: 11,
    color: theme.text.tertiary,
    marginTop: 10,
    lineHeight: 16,
  },
  reasonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  reasonSheet: {
    backgroundColor: theme.card,
    borderRadius: 36,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  reasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  reasonTitle: {
    fontFamily: Typography.bold,
    fontSize: 24,
    color: theme.text.primary,
    letterSpacing: -0.5,
  },
  reasonSubtitle: {
    fontFamily: Typography.medium,
    fontSize: 14,
    color: theme.text.tertiary,
    marginTop: 4,
  },
  closeReasonIcon: {
     backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
     padding: 10,
     borderRadius: 14,
  },
  reasonList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
  },
  reasonItemText: {
    fontFamily: Typography.bold,
    fontSize: 15,
    color: theme.text.secondary,
  },
  loadingOver: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  galleryClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 50,
    right: 25,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 15,
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
    height: height * 0.75,
  },
});

export default RequestAlertModal;
