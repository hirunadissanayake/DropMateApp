import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  TextInput,
  PermissionsAndroid,
  Linking,
  Alert,
  Image,
  Modal,
} from 'react-native';






import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import PrimaryButton from '../components/common/PrimaryButton';
import BackButton from '../components/common/BackButton';
import CustomDropdown from '../components/common/CustomDropdown';
import ScreenHeader from '../components/common/ScreenHeader';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

import { useRegistrationStore } from '../store/registrationStore';
import * as authService from '../services/authService';
import { ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { Typography } from '../constants/Typography';




const VerificationScreen = ({ navigation, route }: any) => {
  const { role } = route.params || { role: 'CUSTOMER' };
  const isTraveler = role === 'TRAVELER';

  const { data, updateData } = useRegistrationStore();
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  const openViewer = (uri: string) => {
    setPreviewUri(uri);
    setViewerVisible(true);
  };





  const handlePickImage = async (field: 'selfie' | 'nicFront' | 'nicBack') => {
    Alert.alert(
      'Upload Image',
      'Choose a source',
      [
        {
          text: 'Camera',
          onPress: () => pickUsingCamera(field),
        },
        {
          text: 'Gallery',
          onPress: () => pickUsingGallery(field),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickUsingGallery = async (field: 'selfie' | 'nicFront' | 'nicBack') => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        updateData({ [field]: result.assets[0] });
      }
    } catch (err: any) {
      console.error('Gallery Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Gallery Error',
        text2: err.message || 'Could not open gallery.'
      });
    }
  };


  const pickUsingCamera = async (field: 'selfie' | 'nicFront' | 'nicBack') => {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Access Required',
              message: 'DropMate requires camera access to verify your identity and protect your account secure.',
              buttonNeutral: 'Later',
              buttonNegative: 'Deny',
              buttonPositive: 'Allow Access',
            }
          );

          if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
             Toast.show({
              type: 'error',
              text1: 'Permission Required',
              text2: 'Camera access is permanently disabled. Please enable it in Settings.',
              onPress: () => Linking.openSettings()
            });
            return;
          }


          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return;
          }
        }
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        cameraType: field === 'selfie' ? 'front' : 'back',
        saveToPhotos: false
      });

      if (result.assets && result.assets[0]) {
        updateData({ [field]: result.assets[0] });
      }
    } catch (err) {
      console.error('Camera Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred while opening the camera.'
      });
    }

  };




  const isFormValid = 
    !!data.selfie && 
    !!data.nicFront && 
    !!data.nicBack;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      const registrationData = {
        ...data,
      };
      
      const response = await authService.requestOtp(registrationData);
      console.log('Registration success:', response);
      Toast.show({
        type: 'success',
        text1: response?.message || 'Registration Successful',
        text2: 'Please verify your OTP.'
      });
      navigation.navigate('VerifyOTP', { phoneNumber: data.phone });
    } catch (error: any) {
      console.error('Registration error:', error);
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || 'Something went wrong. Please try again.'
      });
    } finally {

      setLoading(false);
    }
  };


  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#D1FAE5', '#F0FDF4', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          onBack={() => navigation.goBack()} 
          currentStep={3} 
        />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Identity Verification</Text>
            <Text style={styles.subtitle}>
              Complete your profile to unlock shipping and traveling features. Your data is encrypted and used only for compliance.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Personal Identification</Text>
            
            <TouchableOpacity 
              style={[styles.selfieCard, data.selfie && styles.activeCard]} 
              activeOpacity={0.8}
              onPress={() => handlePickImage('selfie')}
            >
              <View style={styles.selfieIconBox}>
                {data.selfie ? (
                   <TouchableOpacity 
                    style={styles.previewImage} 
                    onPress={() => openViewer(data.selfie.uri)}
                   >
                     <Image 
                      source={{ uri: data.selfie.uri }} 
                      style={styles.previewImage} 
                      resizeMode="cover" 
                     />
                   </TouchableOpacity>
                ) : (

                  <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">

                    <Path d="M10.5 18.375C9.975 18.375 9.53125 18.1937 9.16875 17.8312C8.80625 17.4688 8.625 17.025 8.625 16.5C8.625 15.975 8.80625 15.5312 9.16875 15.1687C9.53125 14.8062 9.975 14.625 10.5 14.625C11.025 14.625 11.4688 14.8062 11.8313 15.1687C12.1938 15.5312 12.375 15.975 12.375 16.5C12.375 17.025 12.1938 17.4688 11.8313 17.8312C11.4688 18.1937 11.025 18.375 10.5 18.375ZM19.5 18.375C18.975 18.375 18.5312 18.1937 18.1688 17.8312C17.8063 17.4688 17.625 17.025 17.625 16.5C17.625 15.975 17.8063 15.5312 18.1688 15.1687C18.5312 14.8062 18.975 14.625 19.5 14.625C20.025 14.625 20.4688 14.8062 20.8312 15.1687C21.1937 15.5312 21.375 15.975 21.375 16.5C21.375 17.025 21.1937 17.4688 20.8312 17.8312C20.4688 18.1937 20.025 18.375 19.5 18.375ZM15 27C18.35 27 21.1875 25.8375 23.5125 23.5125C25.8375 21.1875 27 18.35 27 15C27 14.4 26.9625 13.8188 26.8875 13.2563C26.8125 12.6938 26.675 12.15 26.475 11.625C25.95 11.75 25.425 11.8438 24.9 11.9062C24.375 11.9688 23.825 12 23.25 12C20.975 12 18.825 11.5125 16.8 10.5375C14.775 9.5625 13.05 8.2 11.625 6.45C10.825 8.4 9.68125 10.0938 8.19375 11.5312C6.70625 12.9688 4.975 14.05 3 14.775C3 14.825 3 14.8625 3 14.8875C3 14.9125 3 14.95 3 15C3 18.35 4.1625 21.1875 6.4875 23.5125C8.8125 25.8375 11.65 27 15 27ZM15 30C12.925 30 10.975 29.6063 9.15 28.8188C7.325 28.0312 5.7375 26.9625 4.3875 25.6125C3.0375 24.2625 1.96875 22.675 1.18125 20.85C0.39375 19.025 0 17.075 0 15C0 12.925 0.39375 10.975 1.18125 9.15C1.96875 7.325 3.0375 5.7375 4.3875 4.3875C5.7375 3.0375 7.325 1.96875 9.15 1.18125C10.975 0.39375 12.925 0 15 0C17.075 0 19.025 0.39375 20.85 1.18125C22.675 1.96875 24.2625 3.0375 25.6125 4.3875C26.9625 5.7375 28.0312 7.325 28.8188 9.15C29.6063 10.975 30 12.925 30 15C30 17.075 29.6063 19.025 28.8188 20.85C28.0312 22.675 26.9625 24.2625 25.6125 25.6125C24.2625 26.9625 22.675 28.0312 20.85 28.8188C19.025 29.6063 17.075 30 15 30Z" fill={data.selfie ? Colors.primary : "#4A695C"} />
                  </Svg>
                )}
              </View>
              <View style={styles.selfieTextContent}>
                <Text style={styles.uploadTitle}>Upload Selfie</Text>
                <Text style={styles.uploadSubtitle}>{data.selfie ? 'Selfie selected successfully' : 'Take a clear photo of your face facing the camera.'}</Text>
              </View>
              <View style={styles.actionIconBox}>
                <Svg width="22" height="20" viewBox="0 0 22 20" fill="none">
                  <Path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V6C0 5.45 0.195833 4.97917 0.5875 4.5875C0.979167 4.19583 1.45 4 2 4H5.15L7 2H13V4H7.875L6.05 6H2V18H18V9H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H2ZM18 6V4H16V2H18V0H20V2H22V4H20V6H18ZM10 16.5C11.25 16.5 12.3125 16.0625 13.1875 15.1875C14.0625 14.3125 14.5 13.25 14.5 12C14.5 10.75 14.0625 9.6875 13.1875 8.8125C12.3125 7.9375 11.25 7.5 10 7.5C8.75 7.5 7.6875 7.9375 6.8125 8.8125C5.9375 9.6875 5.5 10.75 5.5 12C5.5 13.25 5.9375 14.3125 6.8125 15.1875C7.6875 16.0625 8.75 16.5 10 16.5Z" fill={data.selfie ? Colors.primary : "#BEC9C2"} />
                </Svg>
              </View>
            </TouchableOpacity>


            <View style={styles.splitCards}>
              <TouchableOpacity 
                style={[styles.idCard, data.nicFront && styles.activeIdCard]} 
                activeOpacity={0.8}
                onPress={() => handlePickImage('nicFront')}
              >
                <View style={[styles.dashedBox, { backgroundColor: data.nicFront ? '#F8FAFC' : '#D7F5E5' }]}>
                  {data.nicFront ? (
                    <TouchableOpacity 
                      style={styles.previewImage} 
                      onPress={() => openViewer(data.nicFront.uri)}
                    >
                      <Image 
                        source={{ uri: data.nicFront.uri }} 
                        style={styles.previewImage} 
                        resizeMode="cover" 
                      />
                    </TouchableOpacity>
                  ) : (

                    <Svg width="25" height="20" viewBox="0 0 25 20" fill="none">
                      <Path d="M2.5 20C1.8125 20 1.22396 19.7552 0.734375 19.2656C0.244792 18.776 0 18.1875 0 17.5V2.5C0 1.8125 0.244792 1.22396 0.734375 0.734375C1.22396 0.244792 1.8125 0 2.5 0H22.5C23.1875 0 23.776 0.244792 24.2656 0.734375C24.7552 1.22396 25 1.8125 25 2.5V17.5C25 18.1875 24.7552 18.776 24.2656 19.2656C23.776 19.7552 23.1875 20 22.5 20H2.5ZM2.5 17.5H22.5V2.5H2.5V17.5Z" fill="#6F7A74" />
                    </Svg>
                  )}

                  <Text style={styles.idCardLabel}>{data.nicFront ? 'UPLOADED' : 'FRONT SIDE'}</Text>
                </View>
                <View style={styles.idCardFooter}>
                  <Text style={styles.idCardFooterText}>{data.nicFront ? 'NIC Front Added' : 'Upload NIC Front'}</Text>
                  <Svg width="14" height="17" viewBox="0 0 14 17" fill="none">
                    <Path d="M5.83333 14.1667H7.5V10.6875L8.83333 12.0208L10 10.8333L6.66667 7.5L3.33333 10.8333L4.52083 12L5.83333 10.6875V14.1667H1.66667" fill={data.nicFront ? Colors.primary : "#00513D"} />
                  </Svg>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.idCard, data.nicBack && styles.activeIdCard]} 
                activeOpacity={0.8}
                onPress={() => handlePickImage('nicBack')}
              >
                <View style={[styles.dashedBox, { backgroundColor: data.nicBack ? '#F8FAFC' : '#D7F5E5' }]}>
                  {data.nicBack ? (
                    <TouchableOpacity 
                      style={styles.previewImage} 
                      onPress={() => openViewer(data.nicBack.uri)}
                    >
                      <Image 
                        source={{ uri: data.nicBack.uri }} 
                        style={styles.previewImage} 
                        resizeMode="cover" 
                      />
                    </TouchableOpacity>
                  ) : (

                    <Svg width="25" height="20" viewBox="0 0 25 20" fill="none">
                      <Path d="M2.5 20C1.8125 20 1.22396 19.7552 0.734375 19.2656C0.244792 18.776 0 18.1875 0 17.5V2.5C0 1.8125 0.244792 1.22396 0.734375 0.734375C1.22396 0.244792 1.8125 0 2.5 0H22.5C23.1875 0 23.776 0.244792 24.2656 0.734375C24.7552 1.22396 25 1.8125 25 2.5V17.5C25 18.1875 24.7552 18.776 24.2656 19.2656C23.776 19.7552 23.1875 20 22.5 20H2.5ZM2.5 17.5H22.5V2.5H2.5V17.5Z" fill="#6F7A74" />
                    </Svg>
                  )}

                  <Text style={styles.idCardLabel}>{data.nicBack ? 'UPLOADED' : 'BACK SIDE'}</Text>
                </View>
                <View style={styles.idCardFooter}>
                  <Text style={styles.idCardFooterText}>{data.nicBack ? 'NIC Back Added' : 'Upload NIC Back'}</Text>
                  <Svg width="14" height="17" viewBox="0 0 14 17" fill="none">
                    <Path d="M5.83333 14.1667H7.5V10.6875L8.83333 12.0208L10 10.8333L6.66667 7.5L3.33333 10.8333L4.52083 12L5.83333 10.6875V14.1667H1.66667" fill={data.nicBack ? Colors.primary : "#00513D"} />
                  </Svg>
                </View>
              </TouchableOpacity>
            </View>

          </View>



          <View style={styles.footerSection}>
            <PrimaryButton 
              text="Submit & Verify" 
              onPress={handleSubmit} 
              loading={loading}
              disabled={!isFormValid}
              style={styles.ctaButton}
              icon={
                <Svg width="22" height="21" viewBox="0 0 22 21" fill="none">
                  <Path d="M22 10.5C22 16.3 17.3 21 11.5 21S1 16.3 1 10.5 5.7 0 11.5 0 22 4.7 22 10.5ZM9.95 14.05L15.6 8.4L14.2 6.95L9.95 11.2L7.8 9.1L6.4 10.5L9.95 14.05Z" fill="white" />
                </Svg>
              }
            />

            
            <View style={styles.encryptionBadge}>
              <Svg width="10" height="13" viewBox="0 0 10 13" fill="none">
                <Path d="M1.16 12.25h7v-7H1.16v7zM4.66 9.33c.32 0 .6-.11.83-.34.23-.23.34-.51.34-.83 0-.32-.11-.6-.34-.83s-.51-.34-.83-.34c-.32 0-.6.11-.83.34-.23.23-.34.51-.34.83 0 .32.11.6.34.83s.51.34.83.34zM2.91 4.08h3.5V2.92C6.41 2.43 6.25 2.02 5.91 1.68 5.57 1.34 5.15 1.17 4.67 1.17s-.91.17-1.25.51c-.34.34-.51.75-.51 1.24v1.16z" fill="#3F4944" />
              </Svg>
              <Text style={styles.encryptionText}>End-to-End Encrypted Verification Process</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal 
        visible={viewerVisible} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerBackground}>
          <TouchableOpacity 
            style={styles.closeViewer} 
            onPress={() => setViewerVisible(false)}
          >
             <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
               <Path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </Svg>
          </TouchableOpacity>
          {previewUri && (
            <Image 
              source={{ uri: previewUri }} 
              style={styles.fullImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </View>

  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 34,
    color: Colors.text.primary,
    fontFamily: Typography.extraBold,
    letterSpacing: -1.5,
    marginBottom: 12,
    textAlign:'center'
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    lineHeight: 24,
    opacity: 0.7,
    textAlign:'center'
  },
  section: {
    marginBottom: 44,
  },
  sectionHeader: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 20,
    textTransform: 'uppercase',
    fontFamily: Typography.bold,
    paddingLeft: 4,
  },
  selfieCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 108, 82, 0.05)',
    overflow: 'hidden',
  },
  activeCard: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
  },
  activeIdCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },

  selfieIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 108, 82, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieTextContent: {
    flex: 1,
    marginLeft: 18,
    gap: 4,
  },
  uploadTitle: {
    fontSize: 17,
    color: '#052017',
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontFamily: Typography.regular,
    opacity: 0.6,
  },
  actionIconBox: {
    marginLeft: 8,
  },
  cameraCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  splitCards: {
    flexDirection: 'row',
    gap: 16,
  },
  idCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 194, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  dashedBox: {
    height: 130,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  idCardLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: Typography.bold,
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 2,
  },
  idCardFooterText: {
    fontSize: 13,
    color: '#052017',
    fontFamily: Typography.bold,
  },
  miniUploadBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 108, 82, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelerCard: {
    borderRadius: 28,
    padding: 28,
    gap: 28,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 108, 82, 0.06)',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 8,
  },
  travelerHeader: {
    gap: 16,
  },
  travelerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    alignSelf: 'flex-start',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  travelerBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    fontFamily: Typography.bold,
  },
  travelerInfoText: {
    gap: 6,
  },
  travelerTitle: {
    fontSize: 20,
    color: '#052017',
    letterSpacing: -0.5,
    fontFamily: Typography.bold,
  },
  travelerDesc: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
    opacity: 0.8,
  },
  formGroup: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    paddingLeft: 4,
    fontFamily: Typography.bold,
  },
  selectBox: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(190, 201, 194, 0.15)',
  },
  selectText: {
    fontSize: 16,
    color: '#052017',
    fontFamily: Typography.bold,
  },
  inputContainer: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(190, 201, 194, 0.15)',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#052017',
    fontWeight: '700',
    fontFamily: Typography.bold,
  },
  unitBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unitText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: Typography.bold,
  },
  payoutAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 108, 82, 0.04)',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  alertIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 108, 82, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutAlertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#00513D',
    lineHeight: 18,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  footerSection: {

    marginTop: 20,
    alignItems: 'center',
    gap: 24,
  },
  ctaButton: {
    height: 68,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewerBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeViewer: {
    position: 'absolute',
    top: 50,
    right: 30,
    zIndex: 10,
    padding: 10,
  },
  fullImage: {
    width: '90%',
    height: '80%',
    borderRadius: 16,
  },
  encryptionText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontFamily: Typography.bold,
    opacity: 0.8,
  },
});

export default VerificationScreen;
