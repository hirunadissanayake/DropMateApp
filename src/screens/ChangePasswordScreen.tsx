import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../store/authStore';
import PrimaryButton from '../components/common/PrimaryButton';
import CustomInput from '../components/common/CustomInput';
import * as authService from '../services/authService';
import Toast from 'react-native-toast-message';
import { Typography } from '../constants/Typography';
import BackButton from '../components/common/BackButton';

const getStrengthScore = (pass: string) => {
  let score = 0;
  if (!pass) return 0;
  if (pass.length >= 6) score++;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return score;
};

const ChangePasswordScreen = ({ navigation }: any) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { token, user } = useAuthStore();

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'info',
        text1: 'Required Fields',
        text2: 'Please fill in all password fields.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'New password and confirm password do not match.'
      });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Requires upper, lower, number, and symbol (min 6 chars).'
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!token) throw new Error('Authentication token missing');
      
      const response = await authService.changePassword(token, {
        oldPassword,
        newPassword
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Password changed successfully!'
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('Change password error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Incorrect old password or server error.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={Colors.bgGradient}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton 
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            color="#006C52"
          />
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                 <LinearGradient
                   colors={['#006C52', '#00A884']}
                   style={styles.iconGradient}
                 >
                   <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                     <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                   </Svg>
                 </LinearGradient>
              </View>

              <Text style={styles.description}>
                To secure your account, please enter your current password and choose a strong new password.
              </Text>

              <View style={styles.securityHint}>
                 <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2">
                   <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                 </Svg>
                 <Text style={styles.securityHintText}>Use 6+ characters with a mix of letters, numbers & symbols.</Text>
              </View>

              <View style={styles.formContainer}>
                <CustomInput
                  label="CURRENT PASSWORD"
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  isPassword={true}
                />

                <CustomInput
                  label="NEW PASSWORD"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  isPassword={true}
                />

                {newPassword.length > 0 && (
                  <View style={styles.strengthGrid}>
                    {[1, 2, 3, 4].map((index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.strengthBar, 
                          getStrengthScore(newPassword) >= index && styles.strengthActive
                        ]} 
                      />
                    ))}
                  </View>
                )}

                <CustomInput
                  label="CONFIRM NEW PASSWORD"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword={true}
                  containerStyle={{ marginTop: newPassword.length > 0 ? 12 : 0 }}
                />

                <PrimaryButton 
                  text="Update Password" 
                  onPress={handleChangePassword} 
                  loading={isLoading}
                  style={styles.updateButton}
                />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: Typography.regular,
  },
  formContainer: {
    width: '100%',
  },
  updateButton: {
    marginTop: 24,
    marginBottom: 40,
  },
  strengthGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: -8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBE9DA',
  },
  strengthActive: {
    backgroundColor: '#00513D',
  },
  securityHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
    width: '100%',
  },
  securityHintText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
    fontFamily: Typography.medium,
  },
});

export default ChangePasswordScreen;
