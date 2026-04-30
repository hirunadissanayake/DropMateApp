import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useEffect } from 'react';
import { useRegistrationStore } from '../store/registrationStore';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';
import BackButton from '../components/common/BackButton';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const { width } = Dimensions.get('window');

const PersonalDetailsScreen = () => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation();
  const { user: authUser } = useAuthStore();
  const { updateData: updateRegistrationData } = useRegistrationStore();
  const [user, setLocalUser] = useState(authUser);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const role = authUser?.roleActive;
  const isVerified = role === 'TRAVELER' ? authUser?.isTravelerApproved : authUser?.isCustomerApproved;
  const isPending = role === 'TRAVELER' ? (authUser?.isTravelerRequested && !authUser?.isTravelerApproved) : (authUser?.isCustomerRequested && !authUser?.isCustomerApproved);
  const isDualVerified = authUser?.isTravelerApproved && authUser?.isCustomerApproved;
  
  const isRejected = !isVerified && !isPending && !!authUser?.rejectionReason;

  useEffect(() => {
    if (isRejected) {
        updateRegistrationData({
            fullName: user?.name ?? undefined,
            email: user?.email ?? undefined,
            nicNumber: user?.nicNumber ?? undefined,
            permanentAddress: user?.permanentAddress ?? undefined,
            city: user?.city ?? undefined,
            phone: user?.phone ?? undefined
        });
    }
  }, [isRejected]);

  const handleUpdateField = (field: string, value: string) => {
      setLocalUser(prev => prev ? { ...prev, [field]: value } : null);
      
      const storeFieldMap: any = {
          name: 'fullName',
          nicNumber: 'nicNumber',
          permanentAddress: 'permanentAddress',
          city: 'city'
      };
      
      if (storeFieldMap[field]) {
          updateRegistrationData({ [storeFieldMap[field]]: value });
      }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} translucent backgroundColor="transparent" />
      
      <SafeAreaView edges={['top']} style={styles.headerNav}>
        <View style={styles.navRow}>
          <BackButton 
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            color={theme.primary}
          />
          <Text style={styles.headerTitle}>Personal Details</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={theme.isDark ? ['rgba(13, 31, 24, 0.8)', theme.background] : ['#F8FAFC', '#FFFFFF']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.contentPadding}>
            {/* Status Card */}
            {!isRejected ? (
                <View style={[styles.statusCard, { borderColor: isVerified ? (theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7') : (theme.isDark ? 'rgba(234, 179, 8, 0.2)' : '#FEF9C3') }]}>
                    <View style={[styles.statusIconBox, { backgroundColor: isVerified ? (theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#DCFCE7') : (theme.isDark ? 'rgba(234, 179, 8, 0.1)' : '#FEF9C3') }]}>
                        {isDualVerified ? (
                          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.isDark ? '#3DD9A4' : '#166534'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                            <Path d="m9 12 2 2 4-4" />
                          </Svg>
                        ) : isVerified ? (
                            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.isDark ? '#3DD9A4' : '#166534'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <Path d="m9 12 2 2 4-4" />
                            </Svg>
                        ) : (
                            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.isDark ? '#EAB308' : '#854D0E'} strokeWidth="2.5">
                                <Circle cx="12" cy="12" r="10" />
                                <Path d="M12 8v4" />
                                <Path d="M12 16h.01" />
                            </Svg>
                        )}
                    </View>
                    <View>
                        <Text style={styles.statusLabel}>Account Status</Text>
                        <Text style={[styles.statusValue, { color: isDualVerified ? (theme.isDark ? '#3DD9A4' : '#166534') : isVerified ? theme.primary : (theme.isDark ? '#EAB308' : '#854D0E') }]}>
                            {isDualVerified ? 'Fully Verified (Dual Role)' : isVerified ? 'Verified Account' : isPending ? 'Pending Verification' : 'Verification Required'}
                        </Text>
                    </View>
                </View>
            ) : (
                <View style={[styles.statusCard, { 
                    borderColor: '#FCA5A5', 
                    backgroundColor: theme.isDark ? 'rgba(254, 242, 242, 0.05)' : '#FEF2F2', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start' 
                }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <View style={[styles.statusIconBox, { backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2' }]}>
                            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                                <Path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </Svg>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.statusLabel, { color: theme.isDark ? '#FCA5A5' : '#991B1B' }]}>Verification Rejected</Text>
                            <Text style={[styles.statusValue, { color: '#EF4444' }]}>Action Required</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.editToggleBtn}
                            onPress={() => setIsEditing(!isEditing)}
                        >
                            <Text style={styles.editToggleText}>{isEditing ? 'Done' : 'Edit Info'}</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.rejectionBox}>
                        <Text style={styles.rejectionReasonTitle}>REASON FOR REJECTION:</Text>
                        <Text style={styles.rejectionReasonText}>"{user?.rejectionReason}"</Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.resubmitBtn}
                        onPress={() => (navigation as any).navigate('Verification', { role: user?.roleActive || 'TRAVELER' })}
                    >
                        <Text style={styles.resubmitText}>Fix Documents & Resubmit</Text>
                        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3">
                            <Path d="M5 12h14M12 5l7 7-7 7" />
                        </Svg>
                    </TouchableOpacity>
                </View>
            )}


            {/* Information Grid */}
            <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Identity Information</Text>
                <View style={styles.infoList}>
                    <InfoRow 
                        label="Full Name" 
                        value={user?.name} 
                        icon="user" 
                        editable={isEditing}
                        onChangeText={(t: string) => handleUpdateField('name', t)}
                        theme={theme}
                    />
                    <InfoRow label="Email Address" value={user?.email} icon="mail" theme={theme} />
                    <InfoRow 
                        label="NIC Number" 
                        value={user?.nicNumber} 
                        icon="credit-card" 
                        editable={isEditing}
                        onChangeText={(t: string) => handleUpdateField('nicNumber', t)}
                        theme={theme}
                    />
                    <InfoRow 
                        label="Permanent Address" 
                        value={user?.permanentAddress} 
                        icon="map-pin" 
                        editable={isEditing}
                        onChangeText={(t: string) => handleUpdateField('permanentAddress', t)}
                        theme={theme}
                    />
                    <InfoRow 
                        label="City" 
                        value={user?.city} 
                        icon="map-pin" 
                        editable={isEditing}
                        onChangeText={(t: string) => handleUpdateField('city', t)}
                        theme={theme}
                    />
                    <InfoRow label="Phone Number" value={user?.phone} icon="phone" theme={theme} />
                </View>
            </View>

            {/* Documents Section */}
            <View style={[styles.cardSection, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Uploaded Documents</Text>
                <View style={styles.docsGrid}>
                    <DocumentItem 
                        label="Selfie Photo" 
                        uri={user?.selfieUrl} 
                        onPress={() => setPreviewImage(user?.selfieUrl || null)} 
                        theme={theme}
                    />
                    <DocumentItem 
                        label="NIC Front" 
                        uri={user?.nicFrontUrl} 
                        onPress={() => setPreviewImage(user?.nicFrontUrl || null)} 
                        theme={theme}
                    />
                    <DocumentItem 
                        label="NIC Back" 
                        uri={user?.nicBackUrl} 
                        onPress={() => setPreviewImage(user?.nicBackUrl || null)} 
                        theme={theme}
                    />
                </View>
            </View>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewImage(null)}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
                      <Path d="M18 6L6 18M6 6l12 12"/>
                  </Svg>
              </TouchableOpacity>
              {previewImage && (
                  <Image source={{ uri: previewImage }} style={styles.modalImage} resizeMode="contain" />
              )}
          </View>
      </Modal>
    </View>
  );
};

const InfoRow = ({ label, value, icon, editable, onChangeText, theme }: any) => {
    const s = makeStyles(theme);
    return (
        <View style={s.infoRow}>
            <View style={s.infoIconBox}>
                {renderIcon(icon, theme)}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.infoLabelText}>{label}</Text>
                {editable ? (
                    <TextInput 
                        style={[s.infoValueText, s.editableInput]}
                        value={value}
                        onChangeText={onChangeText}
                        autoCapitalize="words"
                        placeholderTextColor={theme.text.placeholder}
                    />
                ) : (
                    <Text style={s.infoValueText}>{value || 'Not provided'}</Text>
                )}
            </View>
        </View>
    );
};

const DocumentItem = ({ label, uri, onPress, theme }: any) => {
    const s = makeStyles(theme);
    return (
        <TouchableOpacity style={s.docBox} onPress={onPress}>
            <View style={s.imagePlaceholder}>
                {uri ? (
                    <Image source={{ uri }} style={s.docImage} />
                ) : (
                    <View style={s.noImage}>
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                            <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                            <Path d="M16 5V1v4z" />
                            <Circle cx="9" cy="9" r="2" />
                            <Path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </Svg>
                    </View>
                )}
            </View>
            <Text style={s.docLabelText}>{label}</Text>
        </TouchableOpacity>
    );
};

const renderIcon = (name: string, theme: AppTheme) => {
    const size = 18;
    const color = theme.text.tertiary;
    if(name === 'user') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Circle cx="12" cy="7" r="4"/><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></Svg>
    if(name === 'mail') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Rect x="2" y="4" width="20" height="16" rx="2"/><Path d="M22 6l-10 7L2 6"/></Svg>
    if(name === 'credit-card') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Rect x="1" y="4" width="22" height="16" rx="2"/><Path d="M1 10h22"/></Svg>
    if(name === 'phone') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>
    if(name === 'map-pin') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle cx="12" cy="10" r="3"/></Svg>
    return null;
}

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerNav: {
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
  },
  contentPadding: {
      paddingHorizontal: 16,
  },
  statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
  },
  statusIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
  },
  statusLabel: {
      fontSize: 12,
      color: theme.text.tertiary,
      fontFamily: Typography.medium,
      marginBottom: 2,
  },
  statusValue: {
      fontSize: 16,
      fontFamily: Typography.bold,
      color: theme.text.primary,
  },
  cardSection: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    color: theme.text.primary,
    marginBottom: 24,
    fontFamily: Typography.bold,
  },
  infoList: {
      gap: 20,
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
  },
  infoIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.isDark ? theme.inputBg : '#F8FAFC',
      alignItems: 'center',
      justifyContent: 'center',
  },
  infoLabelText: {
      fontSize: 12,
      color: theme.text.tertiary,
      fontFamily: Typography.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 2,
  },
  infoValueText: {
      fontSize: 14,
      color: theme.text.primary,
      fontFamily: Typography.bold,
  },
  docsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
  },
  docBox: {
      flex: 1,
      alignItems: 'center',
      gap: 8,
  },
  imagePlaceholder: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 16,
      backgroundColor: theme.isDark ? theme.inputBg : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
  },
  docImage: {
      width: '100%',
      height: '100%',
  },
  noImage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  docLabelText: {
      fontSize: 10,
      color: theme.text.secondary,
      fontFamily: Typography.bold,
      textAlign: 'center',
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  modalClose: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
  },
  modalImage: {
      width: width,
      height: width * 1.5,
  },
  rejectionBox: {
      width: '100%',
      padding: 16,
      backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
      borderRadius: 16,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
  },
  rejectionReasonTitle: {
      fontSize: 9,
      fontFamily: Typography.bold,
      color: theme.isDark ? '#FCA5A5' : '#991B1B',
      letterSpacing: 0.5,
      marginBottom: 6,
  },
  rejectionReasonText: {
      fontSize: 14,
      color: theme.isDark ? '#FCA5A5' : '#B91C1C',
      fontFamily: Typography.bold,
      lineHeight: 20,
      fontStyle: 'italic',
  },
  resubmitBtn: {
      width: '100%',
      height: 56,
      backgroundColor: '#EF4444',
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 6,
  },
  resubmitText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: Typography.extraBold,
  },
  editToggleBtn: {
      backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(185, 28, 28, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(185, 28, 28, 0.2)',
  },
  editToggleText: {
      fontSize: 12,
      color: theme.isDark ? '#FCA5A5' : '#B91C1C',
      fontFamily: Typography.bold,
  },
  editableInput: {
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 4,
      borderWidth: 1,
      borderColor: theme.border,
      color: theme.text.primary,
  },
});

export default PersonalDetailsScreen;
