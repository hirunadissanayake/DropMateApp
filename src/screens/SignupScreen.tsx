import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import PrimaryButton from '../components/common/PrimaryButton';
import BackButton from '../components/common/BackButton';
import ScreenHeader from '../components/common/ScreenHeader';
import Toast from 'react-native-toast-message';

import { useRegistrationStore } from '../store/registrationStore';

interface InputFieldProps {
  label: string;
  placeholder: string;
  icon: (color: string) => React.ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  onToggleSecure?: () => void;
  maxLength?: number;
  isPassword?: boolean;
  error?: string;
}

const InputField = ({ label, placeholder, icon, value, onChangeText, isPassword, maxLength, error }: Partial<InputFieldProps>) => {
  const [internalSecure, setInternalSecure] = useState(true);
  
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, error ? { borderColor: '#D32F2F' } : {}]}>
        <View style={styles.iconBox}>
          {icon && icon(Colors.text.tertiary)}
        </View>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="rgba(111, 122, 116, 0.5)"
          value={value}
          onChangeText={onChangeText || (() => {})}
          secureTextEntry={isPassword ? internalSecure : false}
          maxLength={maxLength}
        />

        {isPassword && (
          <TouchableOpacity 
            style={styles.eyeIconBox} 
            onPress={() => setInternalSecure(!internalSecure)}
          >
            <Svg width="22" height="24" viewBox="0 0 24 24" fill="none">
              {!internalSecure ? (
                <Path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                  fill="#6F7A74"
                  fillOpacity="0.6"
                />
              ) : (
                <Path
                  d="M12 7C14.76 7 17 9.24 17 12C17 13.41 16.42 14.67 15.48 15.59L17.5 17.61C19.33 16.22 20.73 14.28 21.58 12C19.91 7.61 15.64 4.5 10.58 4.5C9.05 4.5 7.6 4.8 6.28 5.37L8.08 7.17C8.86 7.06 9.66 7 10.5 7H12ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.88 19.5 15.63 19.06 17.2 18.27L17.72 18.79L20.45 21.52L21.73 20.24L3.27 1.79L2 3.06L2 4.27ZM9.53 11.8L11.78 14.05C11.39 14.16 10.96 14.22 10.5 14.22C9.27 14.22 8.28 13.23 8.28 12C8.28 11.54 8.34 11.11 8.45 10.72L9.53 11.8ZM14.22 12C14.22 10.77 13.23 9.78 12 9.78C11.54 9.78 11.11 9.84 10.72 9.95L9.34 8.57C10.15 8.1 11.04 7.82 12 7.82C14.31 7.82 16.18 9.69 16.18 12C16.18 12.96 15.9 13.85 15.43 14.66L14.05 13.28C14.16 12.89 14.22 12.46 14.22 12Z"
                  fill="#6F7A74"
                  fillOpacity="0.6"
                />
              )}
            </Svg>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const SignupScreen = ({ navigation, route }: any) => {
  const { role } = route.params || { role: 'CUSTOMER' };
  const updateRegistrationData = useRegistrationStore((state) => state.updateData);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const isFormValid = 
    formData.fullName.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.phone.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== '' &&
    agreed;

  const handleSignup = () => {
    const { fullName, email, phone, password, confirmPassword } = formData;
    const newErrors: any = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (/^\d+$/.test(fullName)) {
      newErrors.fullName = 'Name cannot be only numbers';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    const phoneRegex = /^\d{10}$/;
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(phone)) {
      newErrors.phone = 'Must be exactly 10 digits';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreed) {
      Toast.show({ type: 'info', text1: 'Terms & Conditions', text2: 'Please accept to proceed.' });
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && agreed) {
      updateRegistrationData({
        ...formData,
        roleRequested: role as 'CUSTOMER' | 'TRAVELER',
        termsAccepted: agreed,
      });
      navigation.navigate('Verification', { role });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <LinearGradient
          colors={['#D1FAE5', '#F0FDF4', '#FFFFFF']}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          onBack={() => navigation.goBack()} 
          currentStep={2} 
        />

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join the network of seamless parcel logistics. Let's start with your basic details.
              </Text>
            </View>

            <View style={styles.formCard}>
              <InputField
                label="FULL NAME"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                error={errors.fullName}
                icon={(c) => (
                  <Svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <Path d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8Z" fill={c} />
                    <Path d="M0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55V16H0Z" fill={c} />
                  </Svg>
                )}
              />

              <InputField
                label="EMAIL ADDRESS"
                placeholder="name@example.com"
                value={formData.email}
                onChangeText={(t) => setFormData({ ...formData, email: t.toLowerCase() })}
                error={errors.email}
                icon={(c) => (
                  <Svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                    <Path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V14C20 14.55 19.8042 15.0208 19.4125 15.4125C19.0208 15.8042 18.55 16 18 16H2ZM10 9L2 4V14H18V4L10 9ZM10 7L18 2H2L10 7Z" fill={c} />
                  </Svg>
                )}
              />

              <InputField
                label="PHONE NUMBER"
                placeholder="0771234567"
                value={formData.phone}
                maxLength={10}
                onChangeText={(t) => {
                  const numericValue = t.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, phone: numericValue });
                }}
                error={errors.phone}
                icon={(c) => (
                  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <Path d="M16.95 18C14.8667 18 12.8083 17.5458 10.775 16.6375C8.74167 15.7292 6.89167 14.4417 5.225 12.775C3.55833 11.1083 2.27083 9.25833 1.3625 7.225C0.454167 5.19167 0 3.13333 0 1.05C0 0.75 0.1 0.5 0.3 0.3C0.5 0.1 0.75 0 1.05 0H5.1C5.33333 0 5.54167 0.0791667 5.725 0.2375C5.90833 0.395833 6.01667 0.583333 6.05 0.8H6.7 4.3C6.73333 4.56667 6.725 4.79167 6.675 4.975C6.625 5.15833 6.53333 5.31667 6.4 5.45L3.975 7.9C4.30833 8.51667 4.70417 9.1125 5.1625 9.6875C5.62083 10.2625 6.125 10.8167 6.675 11.35C7.19167 11.8667 7.73333 12.3458 8.3 12.7875C8.86667 13.2292 9.46667 13.6333 10.1 14L12.45 11.65C12.6 11.5 12.7958 11.3875 13.0375 11.3125C13.2792 11.2375 13.5167 11.2167 13.75 11.25L17.2 11.95C17.4333 12.0167 17.625 12.1375 17.775 12.3125C17.925 12.4875 18 12.6833 18 12.9V16.95C18 17.25 17.9 17.5 17.7 17.7C17.5 17.9 17.25 18 16.95 18Z" fill={c} />
                  </Svg>
                )}
              />

              <InputField
                label="PASSWORD"
                placeholder="••••••••"
                isPassword
                value={formData.password}
                onChangeText={(t) => setFormData({ ...formData, password: t })}
                error={errors.password}
                icon={(c) => (
                  <Svg width="16" height="21" viewBox="0 0 16 21" fill="none">
                    <Path d="M2 21C1.45 21 0.979167 20.8042 0.5875 20.4125C0.195833 20.0208 0 19.55 0 19V9C0 8.45 0.195833 7.97917 0.5875 7.5875C0.979167 7.19583 1.45 7 2 7H3V5C3 3.61667 3.4875 2.4375 4.4625 1.4625C5.4375 0.4875 6.61667 0 8 0C9.38333 0 10.5625 0.4875 11.5375 1.4625C12.5125 2.4375 13 3.61667 13 5V7H14C14.55 7 15.0208 7.19583 15.4125 7.5875C15.8042 7.97917 16 8.45 16 9V19C16 19.55 15.8042 20.0208 15.4125 20.4125C15.0208 20.8042 14.55 21 14 21H2ZM8 16C8.55 16 9.02083 15.8042 9.4125 15.4125C9.80417 15.0208 10 14.55 10 14C10 13.45 9.80417 12.9792 9.4125 12.5875C9.02083 12.1958 8.55 12 8 12C7.45 12 6.97917 12.1958 6.5875 12.5875C6.19583 12.9792 6 13.45 6 14C6 14.55 6.19583 15.0208 6.5875 15.4125C6.97917 15.8042 7.45 16 8 16ZM5 7H11V5C11 4.16667 10.7083 3.45833 10.125 2.875C9.54167 2.29167 8.83333 2 8 2C7.16667 2 6.45833 2.29167 5.875 2.875C5.29167 3.45833 5 4.16667 5 5V7Z" fill={c} />
                  </Svg>
                )}
              />

              <InputField
                label="CONFIRM PASSWORD"
                placeholder="••••••••"
                isPassword
                value={formData.confirmPassword}
                onChangeText={(t) => setFormData({ ...formData, confirmPassword: t })}
                error={errors.confirmPassword}
                icon={(c) => (
                  <Svg width="16" height="21" viewBox="0 0 16 21" fill="none">
                    <Path d="M2 21C1.45 21 0.979167 20.8042 0.5875 20.4125C0.195833 20.0208 0 19.55 0 19V9C0 8.45 0.195833 7.97917 0.5875 7.5875C0.979167 7.19583 1.45 7 2 7H3V5C3 3.61667 3.4875 2.4375 4.4625 1.4625C5.4375 0.4875 6.61667 0 8 0C9.38333 0 10.5625 0.4875 11.5375 1.4625C12.5125 2.4375 13 3.61667 13 5V7H14C14.55 7 15.0208 7.19583 15.4125 7.5875C15.8042 7.97917 16 8.45 16 9V19C16 19.55 15.8042 20.0208 15.4125 20.4125C15.0208 20.8042 14.55 21 14 21H2ZM8 16C8.55 16 9.02083 15.8042 9.4125 15.4125C9.80417 15.0208 10 14.55 10 14C10 13.45 9.80417 12.9792 9.4125 12.5875C9.02083 12.1958 8.55 12 8 12C7.45 12 6.97917 12.1958 6.5875 12.5875C6.19583 12.9792 6 13.45 6 14C6 14.55 6.19583 15.0208 6.5875 15.4125C6.97917 15.8042 7.45 16 8 16ZM5 7H11V5C11 4.16667 10.7083 3.45833 10.125 2.875C9.54167 2.29167 8.83333 2 8 2C7.16667 2 6.45833 2.29167 5.875 2.875C5.29167 3.45833 5 4.16667 5 5V7Z" fill={c} />
                  </Svg>
                )}
              />

              <TouchableOpacity 
                style={styles.termsRow} 
                activeOpacity={0.7}
                onPress={() => setAgreed(!agreed)}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                  {agreed && <Svg width="10" height="8" viewBox="0 0 10 8" fill="none"><Path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsBold}>Terms & Conditions</Text> and <Text style={styles.termsBold}>privacy policy</Text> of DropMate.
                </Text>
              </TouchableOpacity>

              <PrimaryButton 
                text="Continue" 
                onPress={handleSignup} 
                disabled={!isFormValid}
                style={styles.signupButton}
                icon={
                  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <Path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" fill="white" />
                  </Svg>
                }
              />
            </View>

            <View style={styles.trustSection}>
              <View style={styles.trustCard}>
                <View style={styles.trustIconContainer}>
                  <Svg width="20" height="24" viewBox="0 0 16 20" fill="none">
                    <Path d="M8 20C5.68333 19.4167 3.77083 18.0875 2.2625 16.0125C0.754167 13.9375 0 11.6333 0 9.1V3L8 0L16 3V9.1C16 11.6333 15.2458 13.9375 13.7375 16.0125C12.2292 18.0875 10.3167 19.4167 8 20ZM8 17.9C9.73333 17.35 11.1667 16.25 12.3 14.6C13.4333 12.95 14 11.1167 14 9.1V4.375L8 2.125L2 4.375V9.1C2 11.1167 2.56667 12.95 3.7 14.6C4.83333 16.25 6.26667 17.35 8 17.9ZM6.95 13.55L12.6 7.9L11.175 6.475L6.95 10.7L4.85 8.6L3.425 10.025L6.95 13.55Z" fill={Colors.text.brand} />
                  </Svg>
                </View>
                <View style={styles.trustTextContainer}>
                  <Text style={styles.trustTitle}>Secure Data</Text>
                  <Text style={styles.trustDesc}>Your personal information is encrypted and protected.</Text>
                </View>
              </View>

              <View style={styles.trustCard}>
                <View style={styles.trustIconContainer}>
                   <Svg width="24" height="24" viewBox="0 0 20 18" fill="none">
                    <Path d="M9 18V16H17V8.9C17 6.95 16.3208 5.29583 14.9625 3.9375C13.6042 2.57917 11.95 1.9 10 1.9C8.05 1.9 6.39583 2.57917 5.0375 3.9375C3.67917 5.29583 3 6.95 3 8.9V15H2C1.45 15 0.979167 14.8042 0.5875 14.4125C0.195833 14.0208 0 13.55 0 13V11C0 10.65 0.0875 10.3208 0.2625 10.0125C0.4375 9.70417 0.683333 9.45833 1 9.275L1.075 7.95C1.20833 6.81667 1.5375 5.76667 2.0625 4.8C2.5875 3.83333 3.24583 2.99167 4.0375 2.275C4.82917 1.55833 5.7375 1 6.7625 0.6C7.7875 0.2 8.86667 0 10 0C11.1333 0 12.2083 0.2 13.225 0.6C14.2417 1 15.15 1.55417 15.95 2.2625C16.75 2.97083 17.4083 3.80833 17.925 4.775C18.4417 5.74167 18.775 6.79167 18.925 7.925L19 9.225C19.3167 9.375 19.5625 9.6 19.7375 9.9C19.9125 10.2 20 10.5167 20 10.85V13.15C20 13.4833 19.9125 13.8 19.7375 14.1C19.5625 14.4 19.3167 14.625 19 14.775V16C19 16.55 18.8042 17.0208 18.4125 17.4125C18.0208 17.8042 17.55 18 17 18H9Z" fill={Colors.text.brand} />
                  </Svg>
                </View>
                <View style={styles.trustTextContainer}>
                  <Text style={styles.trustTitle}>24/7 Support</Text>
                  <Text style={styles.trustDesc}>Need help? Our concierge team is always available.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={styles.loginHint}
            >
              <Text style={styles.loginHintText}>
                Already have an account? <Text style={styles.loginHintBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
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
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-ExtraBold',
    letterSpacing: -1,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
    lineHeight: 24,
    opacity: 0.8,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#052017',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 251, 235, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 194, 0.2)',
    height: 56,
  },
  iconBox: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  eyeIconBox: {
    padding: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 32,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#BEC9C2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.brand,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
    lineHeight: 20,
  },
  termsBold: {
    fontWeight: '800',
  },
  signupButton: {
    height: 64,
  },
  trustSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  trustCard: {
    flex: 1,
    backgroundColor: '#D7F5E5',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  trustIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  trustTextContainer: {
    gap: 4,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  trustDesc: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 15,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
  },
  loginHint: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  loginHintText: {
    fontSize: 15,
    color: Colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  loginHintBold: {
    color: Colors.primary,
    fontWeight: '800',
  },
});

export default SignupScreen;
