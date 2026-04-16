import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';
import PrimaryButton from '../components/common/PrimaryButton';
import CustomInput from '../components/common/CustomInput';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Zustand State Setup
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = () => {
    // This is where React Query's useMutation will go to call /api/auth/login
    console.log('Login triggered with:', emailOrPhone, password);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={Colors.bgGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Circles at bottom */}
      <View style={styles.decorativeContainer}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              
              {/* Logo Section */}
              <View style={styles.logoRow}>
                <View style={styles.logoIconBox}>
                  <Svg width="23" height="25" viewBox="0 0 23 25" fill="none">
                    <Path
                      d="M10 21.7812V13.2188L2.5 8.875V17.4375L10 21.7812ZM12.5 21.7812L20 17.4375V8.875L12.5 13.2188V21.7812ZM10 24.6562L1.25 19.625C0.854167 19.3958 0.546875 19.0938 0.328125 18.7188C0.109375 18.3438 0 17.9271 0 17.4688V7.53125C0 7.07292 0.109375 6.65625 0.328125 6.28125C0.546875 5.90625 0.854167 5.60417 1.25 5.375L10 0.34375C10.3958 0.114583 10.8125 0 11.25 0C11.6875 0 12.1042 0.114583 12.5 0.34375L21.25 5.375C21.6458 5.60417 21.9531 5.90625 22.1719 6.28125C22.3906 6.65625 22.5 7.07292 22.5 7.53125V17.4688C22.5 17.9271 22.3906 18.3438 22.1719 18.7188C21.9531 19.0938 21.6458 19.3958 21.25 19.625L12.5 24.6562C12.1042 24.8854 11.6875 25 11.25 25C10.8125 25 10.3958 24.8854 10 24.6562ZM16.25 8.15625L18.6562 6.78125L11.25 2.5L8.8125 3.90625L16.25 8.15625ZM11.25 11.0625L13.6875 9.65625L6.28125 5.375L3.84375 6.78125L11.25 11.0625Z"
                      fill="white"
                    />
                  </Svg>
                </View>
                <Text style={styles.brandName}>Drop Mate</Text>
              </View>

              {/* Welcome Text */}
              <View style={styles.headerTextContainer}>
                <Text style={styles.welcomeTitle}>Welcome Back</Text>
                <Text style={styles.welcomeSubtitle}>Log in to manage your deliveries</Text>
              </View>

              {/* Form Content */}
              <View style={styles.formContainer}>
                
                <CustomInput
                  label="EMAIL"
                  placeholder="Enter your email"
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  icon={
                    <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <Path
                        d="M6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM0 13.3333V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V13.3333H0Z"
                        fill={Colors.text.secondary}
                      />
                    </Svg>
                  }
                />

                <View style={styles.passwordContainer}>
                  <TouchableOpacity 
                    style={styles.forgotPasswordButton}
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                  <CustomInput
                    label="PASSWORD"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    icon={
                      <Svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                        <Path
                          d="M1.66667 17.5C1.20833 17.5 0.815972 17.3368 0.489583 17.0104C0.163194 16.684 0 16.2917 0 15.8333V7.5C0 7.04167 0.163194 6.64931 0.489583 6.32292C0.815972 5.99653 1.20833 5.83333 1.66667 5.83333H2.5V4.16667C2.5 3.01389 2.90625 2.03125 3.71875 1.21875C4.53125 0.40625 5.51389 0 6.66667 0C7.81944 0 8.80208 0.40625 9.61458 1.21875C10.4271 2.03125 10.8333 3.01389 10.8333 4.16667V5.83333H11.6667C12.125 5.83333 12.5174 5.99653 12.8438 6.32292C13.1701 6.64931 13.3333 7.04167 13.3333 7.5V15.8333C13.3333 16.2917 13.1701 16.684 12.8438 17.0104C12.5174 17.3368 12.125 17.5 11.6667 17.5H1.66667ZM6.66667 13.3333C7.125 13.3333 7.51736 13.1701 7.84375 12.8438C8.17014 12.5174 8.33333 12.125 8.33333 11.6667C8.33333 11.2083 8.17014 10.816 7.84375 10.4896C7.51736 10.1632 7.125 10 6.66667 10C6.20833 10 5.81597 10.1632 5.48958 10.4896C5.16319 10.816 5 11.2083 5 11.6667C5 12.125 5.16319 12.5174 5.48958 12.8438C5.81597 13.1701 6.20833 13.3333 6.66667 13.3333ZM4.16667 5.83333H9.16667V4.16667C9.16667 3.47222 8.92361 2.88194 8.4375 2.39583C7.95139 1.90972 7.36111 1.66667 6.66667 1.66667C5.97222 1.66667 5.38194 1.90972 4.89583 2.39583C4.40972 2.88194 4.16667 3.47222 4.16667 4.16667V5.83333Z"
                          fill={Colors.text.secondary}
                        />
                      </Svg>
                    }
                    rightIcon={
                      showPassword ? (
                        <Svg width="19" height="13" viewBox="0 0 19 13" fill="none">
                          <Path
                            d="M9.16667 10C10.2083 10 11.0938 9.63542 11.8229 8.90625C12.5521 8.17708 12.9167 7.29167 12.9167 6.25C12.9167 5.20833 12.5521 4.32292 11.8229 3.59375C11.0938 2.86458 10.2083 2.5 9.16667 2.5C8.125 2.5 7.23958 2.86458 6.51042 3.59375C5.78125 4.32292 5.41667 5.20833 5.41667 6.25C5.41667 7.29167 5.78125 8.17708 6.51042 8.90625C7.23958 9.63542 8.125 10 9.16667 10ZM9.16667 8.5C8.54167 8.5 8.01042 8.28125 7.57292 7.84375C7.13542 7.40625 6.91667 6.875 6.91667 6.25C6.91667 5.625 7.13542 5.09375 7.57292 4.65625C8.01042 4.21875 8.54167 4 9.16667 4C9.79167 4 10.3229 4.21875 10.7604 4.65625C11.1979 5.09375 11.4167 5.625 11.4167 6.25C11.4167 6.875 11.1979 7.40625 10.7604 7.84375C10.3229 8.28125 9.79167 8.5 9.16667 8.5ZM9.16667 12.5C7.13889 12.5 5.29167 11.934 3.625 10.8021C1.95833 9.67014 0.75 8.15278 0 6.25C0.75 4.34722 1.95833 2.82986 3.625 1.69792C5.29167 0.565972 7.13889 0 9.16667 0C11.1944 0 13.0417 0.565972 14.7083 1.69792C16.375 2.82986 17.5833 4.34722 18.3333 6.25C17.5833 8.15278 16.375 9.67014 14.7083 10.8021C13.0417 11.934 11.1944 12.5 9.16667 12.5Z"
                            fill={Colors.primary}
                          />
                        </Svg>
                      ) : (
                        <Svg width="19" height="15" viewBox="0 0 19 15" fill="none">
                          <Path
                            d="M1.5 1L17.5 14M5.625 4.5C4.3014 5.37894 3.23841 6.6433 2.5 8.125C3.25 10.0278 4.45833 11.5451 6.125 12.6771C7.79167 13.809 9.63889 14.375 11.6667 14.375C12.7967 14.375 13.8867 14.175 14.8958 13.8047M7.25 2.125C8.61458 1.95833 10.0868 1.875 11.6667 1.875C13.6944 1.875 15.5417 2.44097 17.2083 3.57292C18.875 4.70486 20.0833 6.22222 20.8333 8.125C20.3333 9.39236 19.6458 10.5174 18.7708 11.5M10.75 6.5C11.2322 6.5 11.6946 6.69096 12.0353 7.03165C12.376 7.37234 12.567 7.83478 12.567 8.317C12.567 8.5 12.5317 8.675 12.467 8.8347M9.33333 10.1667C8.8511 10.1667 8.38865 9.97571 8.04797 9.63503C7.70729 9.29435 7.51633 8.83189 7.51633 8.34967C7.51633 8.16667 7.55167 7.99167 7.61633 7.8319"
                            stroke={Colors.text.secondary}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </Svg>
                      )
                    }
                    onPressRightIcon={() => setShowPassword(!showPassword)}
                  />
                </View>

                <PrimaryButton 
                  text="Login" 
                  onPress={handleLogin} 
                  style={styles.loginButton}
                />
                
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
                  <Text style={styles.createAccountText}>Create Account</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  decorativeContainer: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 295,
    overflow: 'hidden',
    opacity: 0.4,
  },
  circle1: {
    position: 'absolute',
    left: -20,
    top: 29,
    width: 234,
    height: 295,
    borderRadius: 150,
    backgroundColor: 'rgba(157, 244, 210, 0.2)',
  },
  circle2: {
    position: 'absolute',
    left: 215,
    top: 59,
    width: 195,
    height: 295,
    borderRadius: 150,
    backgroundColor: 'rgba(209, 239, 224, 0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 40 : 60,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIconBox: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#00513D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.text.brand,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    letterSpacing: -0.8,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  forgotPasswordButton: {
    position: 'absolute',
    right: 4,
    top: 0,
    zIndex: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
  },
  loginButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
});

export default LoginScreen;
