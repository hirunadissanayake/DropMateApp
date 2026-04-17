import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenHeader from '../components/common/ScreenHeader';
import * as authService from '../services/authService';
import { ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useRegistrationStore } from '../store/registrationStore';
import Toast from 'react-native-toast-message';



const { width } = Dimensions.get('window');

const VerifyOTPScreen = ({ navigation, route }: any) => {
  const { phoneNumber, flow = 'REGISTRATION' } = route.params || {};
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(58);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearRegistrationData = useRegistrationStore((state) => state.clearData);


  // Countdown timer logic
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerify = async (providedOtp?: string) => {
    const codeToVerify = providedOtp || otp;
    
    if (codeToVerify.length !== 6) {
      Toast.show({
        type: 'info',
        text1: 'Invalid Code',
        text2: 'Please enter a complete 6-digit code.'
      });
      return;
    }


    setLoading(true);
    try {
      let response;
      if (flow === 'FORGOT_PASSWORD') {
        response = await authService.verifyResetOtp(phoneNumber, codeToVerify);
      } else {
        response = await authService.verifyOtp(phoneNumber, codeToVerify);
      }
      console.log('OTP Verification success:', response);
      
      if (flow === 'REGISTRATION') {
        // For registration, we might get a token and user after OTP
        if (response.token && response.user) {
          setAuth(response.token, response.user);
        }
        clearRegistrationData();
        navigation.navigate('VerificationSuccess');
      } else if (flow === 'LOGIN') {
        let routeName = 'CustomerHome';
        if (response.token && response.user) {
          setAuth(response.token, response.user);
          if (response.user.roleActive === 'TRAVELER') {
            routeName = 'TravelerHome';
          }
        }
        navigation.reset({
          index: 0,
          routes: [{ name: routeName }],
        });
      } else {
        navigation.navigate('ResetPassword', { resetToken: response.resetToken, phoneNumber });
      }
    } catch (error: any) {

      console.error('OTP Verification error:', error);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: error.message || 'The OTP you entered is incorrect.'
      });
    } finally {

      setLoading(false);
    }
  };


  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const isFocused = otp.length === i;
      const char = otp[i] || '';
      boxes.push(
        <TouchableOpacity 
          key={i} 
          style={[styles.otpBox, isFocused && styles.otpActive]}
          activeOpacity={0.8}
          onPress={() => {
            inputRef.current?.blur();
            setTimeout(() => inputRef.current?.focus(), 10);
          }}
        >
          {char ? (
            <Text style={styles.otpChar}>{char}</Text>
          ) : (
            <Text style={styles.otpDot}>{isFocused ? '|' : '•'}</Text>
          )}
        </TouchableOpacity>
      );
    }
    return boxes;
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#E7FFF2', '#F8FFF9', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Backdrop */}
      <View style={styles.decorationContainer}>
        <View style={styles.floatingCircle1} />
        <View style={styles.floatingCircle2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            
            {/* Shield Icon Box */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBox}>
                <Svg width="24" height="30" viewBox="0 0 24 30" fill="none">
                  <Path d="M12 30C8.525 29.125 5.65625 27.1312 3.39375 24.0187C1.13125 20.9062 0 17.45 0 13.65V4.5L12 0L24 4.5V13.65C24 17.45 22.8688 20.9062 20.6063 24.0187C18.3438 27.1312 15.475 29.125 12 30ZM9 21H15C15.425 21 15.7812 20.8563 16.0688 20.5688C16.3563 20.2812 16.5 19.925 16.5 19.5V15C16.5 14.575 16.3563 14.2188 16.0688 13.9312C15.7812 13.6437 15.425 13.5 15 13.5V12C15 11.175 14.7062 10.4688 14.1187 9.88125C13.5312 9.29375 12.825 9 12 9C11.175 9 10.4688 9.29375 9.88125 9.88125C9.29375 10.4688 9 11.175 9 12V13.5C8.575 13.5 8.21875 13.6437 7.93125 13.9312C7.64375 14.2188 7.5 14.575 7.5 15V19.5C7.5 19.925 7.64375 20.2812 7.93125 20.5688C8.21875 20.8563 8.575 21 9 21ZM10.5 13.5V12C10.5 11.575 10.6437 11.2188 10.9312 10.9312C11.2188 10.6437 11.575 10.5 12 10.5C12.425 10.5 12.7812 10.6437 13.0688 10.9312C13.3563 11.2188 13.5 11.575 13.5 12V13.5H10.5Z" fill="white"/>
                </Svg>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>
                We've sent a 6 digit verification code to <Text style={styles.phoneLabel}>{phoneNumber}</Text>
              </Text>
            </View>

            {/* OTP Input Section */}
            <View style={styles.otpGrid}>
              {renderOtpBoxes()}
            </View>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={otp}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, '');
                if (numericText.length <= 6) {
                  setOtp(numericText);
                  if (numericText.length === 6) {
                    handleVerify(numericText);
                  }
                }
              }}
              keyboardType="number-pad"
              maxLength={6}
            />

            {/* Timer Section */}
            <View style={styles.timerContainer}>
              <View style={styles.timerBadge}>
                <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <Path d="M7.75833 8.575L8.575 7.75833L6.41667 5.6V2.91667H5.25V6.06667L7.75833 8.575ZM5.83333 11.6667C5.02639 11.6667 4.26806 11.5135 3.55833 11.2073C2.84861 10.901 2.23125 10.4854 1.70625 9.96042C1.18125 9.43542 0.765625 8.81806 0.459375 8.10833C0.153125 7.39861 0 6.64028 0 5.83333C0 5.02639 0.153125 4.26806 0.459375 3.55833C0.765625 2.84861 1.18125 2.23125 1.70625 1.70625C2.23125 1.18125 2.84861 0.765625 3.55833 0.459375C4.26806 0.153125 5.02639 0 5.83333 0C6.64028 0 7.39861 0.153125 8.10833 0.459375C8.81806 0.765625 9.43542 1.18125 9.96042 1.70625C10.4854 2.23125 10.901 2.84861 11.2073 3.55833C11.5135 4.26806 11.6667 5.02639 11.6667 5.83333C11.6667 6.64028 11.5135 7.39861 11.2073 8.10833C10.901 8.81806 10.4854 9.43542 9.96042 9.96042C9.43542 10.4854 8.81806 10.901 8.10833 11.2073C7.39861 11.5135 6.64028 11.6667 5.83333 11.6667ZM5.83333 10.5C7.12639 10.5 8.22743 10.0455 9.13646 9.13646C10.0455 8.22743 10.5 7.12639 10.5 5.83333C10.5 4.54028 10.0455 3.43924 9.13646 2.53021C8.22743 1.62118 7.12639 1.16667 5.83333 1.16667C4.54028 1.16667 3.43924 1.62118 2.53021 2.53021C1.62118 3.43924 1.16667 4.54028 1.16667 5.83333C1.16667 7.12639 1.62118 8.22743 2.53021 9.13646C3.43924 10.0455 4.54028 10.5 5.83333 10.5Z" fill="#00513D"/>
                </Svg>
                <Text style={styles.timerText}>{formatTime(timer)}</Text>
              </View>
              <View style={styles.resendContainer}>
                <Text style={styles.resendLabel}>Didn't receive the code? </Text>
                <TouchableOpacity onPress={() => setTimer(58)}>
                  <Text style={styles.resendButton}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            </View>

            <PrimaryButton 
              text="Verify" 
              onPress={() => handleVerify()}
              loading={loading}
              disabled={otp.length !== 6}
              style={styles.verifyButton}
              icon={
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" fill="white"/>
                </Svg>
              }
            />


            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardIndicator} />
              <Svg width="48" height="64" viewBox="0 0 64 80" fill="none" style={styles.cardBgIcon}>
                <Path d="M27.8 54.2L50.4 31.6L44.7 25.9L27.8 42.8L19.4 34.4L13.7 40.1L27.8 54.2ZM32 80C22.7333 77.6667 15.0833 72.35 9.05 64.05C3.01667 55.75 0 46.5333 0 36.4V12L32 0L64 12V36.4C64 46.5333 60.9833 55.75 54.95 64.05C48.9167 72.35 41.2667 77.6667 32 80ZM32 71.6C38.9333 69.4 44.6667 65 49.2 58.4C53.7333 51.8 56 44.4667 56 36.4V17.5L32 8.5L8 17.5V36.4C8 44.4667 10.2667 51.8 14.8 58.4C19.3333 65 25.0667 69.4 32 71.6Z" fill="#052017"/>
              </Svg>
              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>Secure Logistics</Text>
                <Text style={styles.cardDesc}>Verification ensures only you can authorize parcel collection and drop-offs.</Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#006C52',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#052017',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#052017',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
  },
  phoneLabel: {
    color: '#052017',
    fontWeight: '700',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 40,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 194, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpActive: {
    borderColor: '#006C52',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
    shadowColor: '#006C52',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  otpDot: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(107, 114, 128, 0.3)',
  },
  cursorContainer: {
    paddingVertical: 4,
  },
  cursorBar: {
    width: 2,
    height: 24,
    backgroundColor: '#006C52',
    borderRadius: 1,
  },
  otpChar: {
    fontSize: 24,
    fontWeight: '900',
    color: '#052017',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-ExtraBold',
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  decorationContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floatingCircle1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 108, 82, 0.04)',
    bottom: -60,
    left: -40,
  },
  floatingCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0, 108, 82, 0.03)',
    top: 100,
    right: -30,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFBEB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00513D',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendLabel: {
    fontSize: 14,
    color: '#3F4944',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
  },
  resendButton: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00513D',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  verifyButton: {
    width: '100%',
    marginBottom: 40,
  },
  infoCard: {
    width: '100%',
    backgroundColor: 'rgba(220, 251, 235, 0.5)',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 108, 82, 0.05)',
  },
  cardIndicator: {
    position: 'absolute',
    left: 0,
    top: 24,
    bottom: 24,
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  cardBgIcon: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    opacity: 0.05,
  },
  cardTextContent: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00513D',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  cardDesc: {
    fontSize: 14,
    color: '#3F4944',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
});

export default VerifyOTPScreen;
