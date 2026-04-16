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
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenHeader from '../components/common/ScreenHeader';

const { width } = Dimensions.get('window');

const ResetPasswordScreen = ({ navigation }: any) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleReset = () => {
    // Navigate back to Login or Success screen
    navigation.navigate('Login');
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#E7FFF2', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            
            {/* Security Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBox}>
                <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99V18.5C12 18.78 11.78 19 11.5 19H12.5C12.22 19 12 18.78 12 18.5V11.99C11.11 11.75 10.43 10.95 10.43 10C10.43 8.86 11.36 7.93 12.5 7.93C13.64 7.93 14.57 8.86 14.57 10C14.57 10.95 13.89 11.75 13 11.99H12Z" fill="#00513D"/>
                </Svg>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.description}>
                Enhance your security. Create a strong password that is at least 8 characters long with numbers and symbols.
              </Text>
            </View>

            {/* Inputs Section */}
            <View style={styles.inputContainer}>
              {/* New Password */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor="rgba(111, 122, 116, 0.4)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Svg width="22" height="24" viewBox="0 0 24 24" fill="none">
                      {showPassword ? (
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
                </View>
              </View>

              {/* Confirm Password */}
              <View style={[styles.inputWrapper, { marginTop: 24 }]}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor="rgba(111, 122, 116, 0.4)"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Svg width="22" height="24" viewBox="0 0 24 24" fill="none">
                      {showConfirmPassword ? (
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
                </View>
              </View>
            </View>

            {/* Action Button */}
            <PrimaryButton 
              text="Reset Password" 
              onPress={handleReset}
              style={styles.actionButton}
            />

            {/* Encrypted Session Footer */}
            <View style={styles.encryptedFooter}>
              <Svg width="14" height="17" viewBox="0 0 14 17" fill="none">
                <Path
                  d="M5.79167 11.2917L10.5 6.58333L9.3125 5.39583L5.79167 8.91667L4.04167 7.16667L2.85417 8.35417L5.79167 11.2917ZM6.66667 16.6667C4.73611 16.1806 3.14236 15.0729 1.88542 13.3438C0.628472 11.6146 0 9.69444 0 7.58333V2.5L6.66667 0L13.3333 2.5V7.58333C13.3333 9.69444 12.7049 11.6146 11.4479 13.3438C10.191 15.0729 8.59722 16.1806 6.66667 16.6667ZM6.66667 14.9167C8.11111 14.4583 9.30556 13.5417 10.25 12.1667C11.1944 10.7917 11.6667 9.26389 11.6667 7.58333V3.64583L6.66667 1.77083L1.66667 3.64583V7.58333C1.66667 9.26389 2.13889 10.7917 3.08333 12.1667C4.02778 13.5417 5.22222 14.4583 6.66667 14.9167Z"
                  fill="#00513D"
                />
              </Svg>
              <Text style={styles.encryptedText}>END-TO-END ENCRYPTED SESSION</Text>
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
    fontWeight: '800',
    color: '#052017',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    marginBottom: 12,
    textAlign: 'center',
    
  },
  description: {
    fontSize: 16,
    color: '#3F4944',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
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
    backgroundColor: 'rgba(0, 108, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',

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
    fontWeight: '800',
    color: '#3F4944',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 194, 0.3)',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#052017',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-SemiBold',
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
    backgroundColor: '#CBE9DA',
  },
  strengthActive: {
    backgroundColor: '#00513D',
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
    opacity: 0.6,
    marginBottom: 24,
  },
  encryptedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3F4944',
    letterSpacing: 1.1,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
});

export default ResetPasswordScreen;
