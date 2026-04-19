import React, { useState } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenHeader from '../components/common/ScreenHeader';
import * as authService from '../services/authService';
import Toast from 'react-native-toast-message';
import { Typography } from '../constants/Typography';

const { width } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      Toast.show({
        type: 'info',
        text1: 'Phone Required',
        text2: 'Please enter your phone number.',
      });
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(cleanPhone)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit phone number.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(cleanPhone);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: response.message || 'OTP sent successfully'
      });
      navigation.navigate('VerifyOTP', { phoneNumber: phoneNumber.trim(), flow: 'FORGOT_PASSWORD' });
    } catch (error: any) {
      console.error('Forgot Password error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: error.message || 'Could not send OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#E7FFF2', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Background Elements */}
      <View style={styles.decorationContainer}>
        <View style={styles.circleLarge} />
        <View style={styles.circleSmall} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            
            {/* Lock Icon Box */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBox}>
                <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <Path
                    d="M18.0067 36C15.5176 36 13.1846 35.5327 11.0077 34.5981C8.83078 33.6635 6.92733 32.3886 5.29737 30.7735C3.66741 29.1584 2.37703 27.2591 1.42622 25.0758C0.475405 22.8924 0 20.5594 0 18.0769H2.00001C2.00001 20.2769 2.42309 22.3455 3.26924 24.2827C4.1154 26.2199 5.26347 27.9135 6.71347 29.3635C8.16347 30.8135 9.85938 31.9571 11.8012 32.7942C13.743 33.6314 15.8093 34.05 18 34.05C22.4667 34.05 26.25 32.5 29.35 29.4C32.45 26.3 34 22.5167 34 18.05C34 13.5833 32.45 9.80001 29.35 6.70001C26.25 3.60001 22.4667 2.05001 18 2.05001C14.7513 2.05001 11.8417 2.90322 9.27117 4.60963C6.70066 6.31603 4.7795 8.54872 3.50771 11.3077H9.30771V13.3077H0V4H2.00001V9.96153C3.44873 6.98974 5.58848 4.58653 8.41925 2.75192C11.25 0.917306 14.4436 0 18 0C20.49 0 22.83 0.472325 25.02 1.41697C27.21 2.36162 29.115 3.64365 30.735 5.26305C32.355 6.88245 33.6375 8.78674 34.5825 10.9759C35.5275 13.1651 36 15.5042 36 17.9933C36 20.4824 35.5277 22.8226 34.583 25.0138C33.6384 27.205 32.3564 29.1111 30.737 30.732C29.1176 32.353 27.2133 33.6362 25.0241 34.5817C22.8349 35.5273 20.4958 36 18.0067 36ZM14 25.5385C13.4987 25.5385 13.0785 25.3689 12.7394 25.0298C12.4003 24.6907 12.2308 24.2705 12.2308 23.7692V17.7692C12.2308 17.268 12.4224 16.8478 12.8058 16.5087C13.1891 16.1696 13.6641 16 14.2308 16V13.7692C14.2308 12.7327 14.5968 11.8454 15.3289 11.1072C16.0609 10.3691 16.9513 10 18 10C19.0487 10 19.9391 10.3691 20.6712 11.1072C21.4032 11.8454 21.7692 12.7327 21.7692 13.7692V16C22.3359 16 22.8109 16.1696 23.1942 16.5087C23.5776 16.8478 23.7692 17.268 23.7692 17.7692V23.7692C23.7692 24.2705 23.5997 24.6907 23.2606 25.0298C22.9215 25.3689 22.5013 25.5385 22 25.5385H14ZM15.7692 16H20.2308V13.7841C20.2308 13.1562 20.0135 12.625 19.5789 12.1904C19.1442 11.7558 18.618 11.5385 18 11.5385C17.3821 11.5385 16.8558 11.7558 16.4212 12.1904C15.9866 12.625 15.7692 13.1562 15.7692 13.7841V16Z"
                    fill="#00513D"
                  />
                </Svg>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.description}>
                Enter your registered phone number below. We will send you a 6-digit OTP to reset your account access.
              </Text>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#BEC9C2"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  maxLength={10}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, '');
                    setPhoneNumber(numericValue);
                  }}
                />
              </View>
            </View>

            {/* Action Button */}
            <PrimaryButton 
              text="Send Reset OTP" 
              onPress={handleSendOTP}
              loading={isLoading}
              style={styles.actionButton}
              icon={
                <Svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                  <Path
                    d="M10.1458 7.5H0V5.83333H10.1458L5.47917 1.16667L6.66667 0L13.3333 6.66667L6.66667 13.3333L5.47917 12.1667L10.1458 7.5Z"
                    fill="white"
                  />
                </Svg>
              }
            />

            {/* Footer Link */}
            <TouchableOpacity 
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.footerText}>
                Remembered your password? <Text style={styles.loginText}>Log In</Text>
              </Text>
            </TouchableOpacity>

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
  decorationContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circleLarge: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(0, 81, 61, 0.05)',
    right: -100,
    bottom: -40,
  },
  circleSmall: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(0, 81, 61, 0.05)',
    left: -40,
    top: 50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
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
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 108, 82, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#052017',
    textAlign: 'center',
    fontFamily: Typography.bold,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#3F4944',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Typography.regular,
    paddingHorizontal: 20,
  },
  inputSection: {
    width: '100%',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3F4944',
    marginBottom: 10,
    paddingLeft: 4,
    fontFamily: Typography.bold,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 194, 0.30)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#052017',
    fontWeight: '600',
    fontFamily: Typography.semiBold,
  },
  actionButton: {
    width: '100%',
    marginBottom: 24,
  },
  footerLink: {
    padding: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#3F4944',
    fontFamily: Typography.regular,
  },
  loginText: {
    color: '#00513D',
    fontWeight: '800',
    fontFamily: Typography.bold,
  },
});

export default ForgotPasswordScreen;
