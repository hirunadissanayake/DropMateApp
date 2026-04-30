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
import { Typography } from '../constants/Typography';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenHeader from '../components/common/ScreenHeader';
import * as authService from '../services/authService';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const { width } = Dimensions.get('window');

const getStrengthScore = (pass: string) => {
  let score = 0;
  if (!pass) return 0;
  if (pass.length >= 6) score++;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return score;
};

const ResetPasswordScreen = ({ navigation, route }: any) => {
  const { resetToken } = route.params || {};
  const { theme } = useTheme();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Toast.show({ type: 'info', text1: 'Fields Required', text2: 'Please enter both passwords.' });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(password)) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Requires 6+ chars, upper, lower, number & symbol.' });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords Mismatch', text2: 'Make sure your passwords match.' });
      return;
    }
    if (!resetToken) {
      Toast.show({ type: 'error', text1: 'Invalid Request', text2: 'Cannot reset password without an authorized token.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword({ resetToken, password, confirmPassword });
      Toast.show({ type: 'success', text1: 'Password Reset', text2: res.message || 'Password updated successfully!' });
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error: any) {
      console.error('Reset password error', error);
      Toast.show({ type: 'error', text1: 'Reset Failed', text2: error.message || 'Failed to update password.' });
    } finally {
      setIsLoading(false);
    }
  };

  const s = makeStyles(theme);

  return (
    <View style={s.mainContainer}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={theme.bgGradient as any}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={s.safeArea}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        
        <ScrollView 
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.content}>
            
            {/* Security Icon */}
            <View style={s.iconContainer}>
              <View style={s.iconBox}>
                <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99V18.5C12 18.78 11.78 19 11.5 19H12.5C12.22 19 12 18.78 12 18.5V11.99C11.11 11.75 10.43 10.95 10.43 10C10.43 8.86 11.36 7.93 12.5 7.93C13.64 7.93 14.57 8.86 14.57 10C14.57 10.95 13.89 11.75 13 11.99H12Z" fill="white"/>
                </Svg>
              </View>
            </View>

            {/* Title Section */}
            <View style={s.titleSection}>
              <Text style={s.title}>Reset Password</Text>
              <Text style={s.description}>
                Enhance your security. Create a strong password that is at least 6 characters long with upper/lower case letters, numbers, and symbols.
              </Text>
            </View>

            {/* Inputs Section */}
            <View style={s.inputContainer}>
              {/* New Password */}
              <View style={s.inputWrapper}>
                <Text style={s.inputLabel}>NEW PASSWORD</Text>
                <View style={s.passwordInputContainer}>
                  <TextInput
                    style={s.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor={theme.text.placeholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={s.eyeIcon}
                  >
                    <Svg width="22" height="24" viewBox="0 0 24 24" fill="none">
                      <Path
                        d={showPassword ? "M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" : "M12 7C14.76 7 17 9.24 17 12C17 13.41 16.42 14.67 15.48 15.59L17.5 17.61C19.33 16.22 20.73 14.28 21.58 12C19.91 7.61 15.64 4.5 10.58 4.5C9.05 4.5 7.6 4.8 6.28 5.37L8.08 7.17C8.86 7.06 9.66 7 10.5 7H12ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.88 19.5 15.63 19.06 17.2 18.27L17.72 18.79L20.45 21.52L21.73 20.24L3.27 1.79L2 3.06L2 4.27ZM9.53 11.8L11.78 14.05C11.39 14.16 10.96 14.22 10.5 14.22C9.27 14.22 8.28 13.23 8.28 12C8.28 11.54 8.34 11.11 8.45 10.72L9.53 11.8ZM14.22 12C14.22 10.77 13.23 9.78 12 9.78C11.54 9.78 11.11 9.84 10.72 9.95L9.34 8.57C10.15 8.1 11.04 7.82 12 7.82C14.31 7.82 16.18 9.69 16.18 12C16.18 12.96 15.9 13.85 15.43 14.66L14.05 13.28C14.16 12.89 14.22 12.46 14.22 12Z"}
                        fill={theme.text.tertiary}
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
                {password.length > 0 && (
                  <View style={s.strengthGrid}>
                    {[1, 2, 3, 4].map((index) => (
                      <View 
                        key={index} 
                        style={[
                          s.strengthBar, 
                          getStrengthScore(password) >= index && s.strengthActive
                        ]} 
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* Confirm Password */}
              <View style={[s.inputWrapper, { marginTop: 24 }]}>
                <Text style={s.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={s.passwordInputContainer}>
                  <TextInput
                    style={s.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor={theme.text.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={s.eyeIcon}
                  >
                    <Svg width="22" height="24" viewBox="0 0 24 24" fill="none">
                      <Path
                        d={showConfirmPassword ? "M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" : "M12 7C14.76 7 17 9.24 17 12C17 13.41 16.42 14.67 15.48 15.59L17.5 17.61C19.33 16.22 20.73 14.28 21.58 12C19.91 7.61 15.64 4.5 10.58 4.5C9.05 4.5 7.6 4.8 6.28 5.37L8.08 7.17C8.86 7.06 9.66 7 10.5 7H12ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.88 19.5 15.63 19.06 17.2 18.27L17.72 18.79L20.45 21.52L21.73 20.24L3.27 1.79L2 3.06L2 4.27ZM9.53 11.8L11.78 14.05C11.39 14.16 10.96 14.22 10.5 14.22C9.27 14.22 8.28 13.23 8.28 12C8.28 11.54 8.34 11.11 8.45 10.72L9.53 11.8ZM14.22 12C14.22 10.77 13.23 9.78 12 9.78C11.54 9.78 11.11 9.84 10.72 9.95L9.34 8.57C10.15 8.1 11.04 7.82 12 7.82C14.31 7.82 16.18 9.69 16.18 12C16.18 12.96 15.9 13.85 15.43 14.66L14.05 13.28C14.16 12.89 14.22 12.46 14.22 12Z"}
                        fill={theme.text.tertiary}
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <PrimaryButton 
              text="Reset Password" 
              onPress={handleReset}
              loading={isLoading}
              style={s.actionButton}
            />

            {/* Encrypted Session Footer */}
            <View style={s.encryptedFooter}>
              <Svg width="14" height="17" viewBox="0 0 14 17" fill="none">
                <Path
                  d="M5.79167 11.2917L10.5 6.58333L9.3125 5.39583L5.79167 8.91667L4.04167 7.16667L2.85417 8.35417L5.79167 11.2917ZM6.66667 16.6667C4.73611 16.1806 3.14236 15.0729 1.88542 13.3438C0.628472 11.6146 0 9.69444 0 7.58333V2.5L6.66667 0L13.3333 2.5V7.58333C13.3333 9.69444 12.7049 11.6146 11.4479 13.3438C10.191 15.0729 8.59722 16.1806 6.66667 16.6667ZM6.66667 14.9167C8.11111 14.4583 9.30556 13.5417 10.25 12.1667C11.1944 10.7917 11.6667 9.26389 11.6667 7.58333V3.64583L6.66667 1.77083L1.66667 3.64583V7.58333C1.66667 9.26389 2.13889 10.7917 3.08333 12.1667C4.02778 13.5417 5.22222 14.4583 6.66667 14.9167Z"
                  fill={theme.primary}
                />
              </Svg>
              <Text style={s.encryptedText}>END-TO-END ENCRYPTED SESSION</Text>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.text.secondary,
    lineHeight: 24,
    fontFamily: Typography.regular,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 44,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: theme.isDark ? 0.35 : 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 40,
  },
  inputWrapper: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    color: theme.text.secondary,
    marginBottom: 10,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: theme.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text.primary,
    fontFamily: Typography.semiBold,
  },
  eyeIcon: {
    padding: 8,
  },
  strengthGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#CBE9DA',
  },
  strengthActive: {
    backgroundColor: theme.primary,
  },
  actionButton: {
    width: '100%',
    marginBottom: 32,
  },
  encryptedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.8,
    marginBottom: 24,
  },
  encryptedText: {
    fontSize: 11,
    color: theme.text.tertiary,
    letterSpacing: 1.1,
    fontFamily: Typography.bold,
  },
});

export default ResetPasswordScreen;
