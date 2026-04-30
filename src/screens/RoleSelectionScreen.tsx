import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import PrimaryButton from '../components/common/PrimaryButton';
import ScreenHeader from '../components/common/ScreenHeader';
import { Typography } from '../constants/Typography';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const { width } = Dimensions.get('window');

// ROLE SELECTION SCREEN
const RoleSelectionScreen = ({ navigation }: any) => {
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'TRAVELER'>('CUSTOMER');
  const { theme } = useTheme();

  // Animation values
  const customerScale = useRef(new Animated.Value(1)).current;
  const travelerScale = useRef(new Animated.Value(1)).current;
  const customerOpacity = useRef(new Animated.Value(1)).current;
  const travelerOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    animateSelection();
  }, [selectedRole]);

  const animateSelection = () => {
    const isCustomer = selectedRole === 'CUSTOMER';

    Animated.parallel([
      Animated.spring(customerScale, {
        toValue: isCustomer ? 1.03 : 0.96,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(travelerScale, {
        toValue: isCustomer ? 0.96 : 1.03,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(customerOpacity, {
        toValue: isCustomer ? 1 : 0.65,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(travelerOpacity, {
        toValue: isCustomer ? 0.65 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    navigation.navigate('Signup', { role: selectedRole });
  };

  const s = makeStyles(theme);

  // Selected card gradient colors
  const selectedGradient = theme.isDark
    ? [`rgba(61, 217, 164, 0.1)`, `rgba(61, 217, 164, 0.02)`]
    : [`rgba(0, 108, 82, 0.06)`, `rgba(255, 255, 255, 0)`];

  return (
    <View style={s.mainContainer}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />

      {/* Background Gradient */}
      <LinearGradient
        colors={theme.bgGradient as any}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={s.safeArea}>
        <ScreenHeader onBack={() => navigation.goBack()} currentStep={1} />

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={s.titleSection}>
            <Text style={s.mainTitle}>Define Your Identity</Text>
            <Text style={s.subtitle}>
              How would you like to use Drop Mate today? You can always change your active profile later.
            </Text>
          </View>

          {/* Role Cards */}
          <View style={s.cardsWrapper}>

            {/* ── Customer Card ── */}
            <Animated.View style={{
              transform: [{ scale: customerScale }],
              opacity: customerOpacity,
              width: '100%',
            }}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setSelectedRole('CUSTOMER')}
                style={[
                  s.roleCard,
                  selectedRole === 'CUSTOMER' && s.selectedCard,
                ]}
              >
                {selectedRole === 'CUSTOMER' && (
                  <LinearGradient
                    colors={selectedGradient as any}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}

                <View style={s.cardContentBox}>
                  <View style={[s.iconContainer, { backgroundColor: theme.primary }]}>
                    <Svg width="38" height="38" viewBox="0 0 23 25" fill="none">
                      <Path
                        d="M10 21.7812V13.2188L2.5 8.875V17.4375L10 21.7812ZM12.5 21.7812L20 17.4375V8.875L12.5 13.2188V21.7812M10 24.6562L1.25 19.625C0.854167 19.3958 0.546875 19.0938 0.328125 18.7188C0.109375 18.3438 0 17.9271 0 17.4688V7.53125C0 7.07292 0.109375 6.65625 0.328125 6.28125C0.546875 5.90625 0.854167 5.60417 1.25 5.375L10 0.34375C10.3958 0.114583 10.8125 0 11.25 0C11.6875 0 12.1042 0.114583 12.5 0.34375L21.25 5.375C21.6458 5.60417 21.9531 5.90625 22.1719 6.28125C22.3906 6.65625 22.5 7.07292 22.5 7.53125V17.4688C22.5 17.9271 22.3906 18.3438 22.1719 18.7188C21.9531 19.0938 21.6458 19.3958 21.25 19.625L12.5 24.6562C12.1042 24.8854 11.6875 25 11.25 25C10.8125 25 10.3958 24.8854 10 24.6562M16.25 8.15625L18.6562 6.78125L11.25 2.5L8.8125 3.90625L16.25 8.15625ZM11.25 11.0625L13.6875 9.65625L6.28125 5.375L3.84375 6.78125L11.25 11.0625"
                        fill="white"
                      />
                    </Svg>
                  </View>

                  <View style={s.cardTextContainer}>
                    <Text style={s.rolePrimary}>Send a Parcel</Text>
                    <Text style={s.roleSecondary}>
                      Ship your items securely with verified travelers
                    </Text>
                  </View>

                  <View style={[s.radioButton, selectedRole === 'CUSTOMER' && s.radioActive]}>
                    {selectedRole === 'CUSTOMER' && <View style={s.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* ── Traveler Card ── */}
            <Animated.View style={{
              transform: [{ scale: travelerScale }],
              opacity: travelerOpacity,
              width: '100%',
            }}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setSelectedRole('TRAVELER')}
                style={[
                  s.roleCard,
                  selectedRole === 'TRAVELER' && s.selectedCard,
                ]}
              >
                {selectedRole === 'TRAVELER' && (
                  <LinearGradient
                    colors={selectedGradient as any}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}

                <View style={s.cardContentBox}>
                  <View style={[s.iconContainer, { backgroundColor: theme.primaryDark }]}>
                    <Svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M7 6V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V6H20C21.1046 6 22 6.89543 22 8V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V8C2 6.89543 2.89543 6 4 6H7ZM9 5H15V6H9V5ZM4 8V18H20V8H4ZM12 12C13.1046 12 14 11.1046 14 10H10C10 11.1046 10.8954 12 12 12Z"
                        fill="white"
                      />
                    </Svg>
                  </View>

                  <View style={s.cardTextContainer}>
                    <Text style={s.rolePrimary}>Travel & Earn</Text>
                    <Text style={s.roleSecondary}>
                      Deliver packages on your journey and get paid
                    </Text>
                  </View>

                  <View style={[s.radioButton, selectedRole === 'TRAVELER' && s.radioActive]}>
                    {selectedRole === 'TRAVELER' && <View style={s.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

          </View>

          {/* Footer */}
          <View style={s.footerSection}>
            <PrimaryButton
              text="Continue"
              onPress={handleContinue}
              style={s.ctaButton}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={s.loginHint}
            >
              <Text style={s.loginHintText}>
                Need to sign in?{' '}
                <Text style={s.loginHintBold}>Login here</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Dynamic Styles
const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
      paddingTop: 40,
      paddingBottom: 40,
    },
    titleSection: {
      alignItems: 'center',
      marginBottom: 50,
    },
    mainTitle: {
      fontSize: 34,
      color: theme.text.primary,
      fontFamily: Typography.extraBold,
      letterSpacing: -1.5,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.text.secondary,
      fontFamily: Typography.regular,
      textAlign: 'center',
      lineHeight: 24,
      opacity: 0.8,
      paddingHorizontal: 20,
    },
    cardsWrapper: {
      gap: 24,
      alignItems: 'center',
      marginBottom: 60,
    },
    roleCard: {
      backgroundColor: 'transparent',
      borderRadius: 32,
      padding: 24,
      borderWidth: 1.5,
      borderColor: theme.isDark
        ? 'rgba(61, 217, 164, 0.12)'
        : 'rgba(255, 255, 255, 0.8)',
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: theme.isDark ? 0.2 : 0.08,
          shadowRadius: 24,
        },
        android: {},
      }),
    },
    selectedCard: {
      backgroundColor: theme.isDark ? 'rgba(30, 51, 40, 0.95)' : '#FFFFFF',
      borderColor: theme.primary,
      borderWidth: theme.isDark ? 1.5 : 0.5,
      ...Platform.select({
        ios: {
          shadowOpacity: theme.isDark ? 0.35 : 0.15,
          shadowRadius: 32,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    cardContentBox: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    cardTextContainer: {
      flex: 1,
      marginLeft: 20,
      backgroundColor: 'transparent',
    },
    rolePrimary: {
      fontSize: 22,
      color: theme.text.primary,
      fontFamily: Typography.bold,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    roleSecondary: {
      fontSize: 14,
      color: theme.text.secondary,
      fontFamily: Typography.regular,
      opacity: 0.75,
      lineHeight: 20,
    },
    radioButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.isDark
        ? 'rgba(61, 217, 164, 0.3)'
        : 'rgba(0, 108, 82, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.isDark ? theme.text.inverse : '#FFFFFF',
    },
    footerSection: {
      marginTop: 'auto',
      alignItems: 'center',
      gap: 20,
    },
    ctaButton: {
      height: 64,
    },
    loginHint: {
      paddingVertical: 10,
    },
    loginHintText: {
      fontSize: 15,
      color: theme.text.secondary,
      fontFamily: Typography.medium,
    },
    loginHintBold: {
      color: theme.primary,
      fontFamily: Typography.bold,
    },
  });

export default RoleSelectionScreen;
