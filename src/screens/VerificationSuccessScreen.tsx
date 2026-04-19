import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import PrimaryButton from '../components/common/PrimaryButton';
import { useAuthStore } from '../store/authStore';
import { Typography } from '../constants/Typography';

const { width, height } = Dimensions.get('window');

const VerificationSuccessScreen = ({ navigation }: any) => {
  // Animation for the Tick Icon
  const tickScale = useRef(new Animated.Value(0)).current;
  const tickOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start Tick Icon Animation
    Animated.spring(tickScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
      delay: 300,
    }).start();

    Animated.timing(tickOpacity, {
      toValue: 1,
      duration: 500,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const { user } = useAuthStore();

  const handleGoHome = () => {
    const nextScreen = user?.roleActive === 'TRAVELER' ? 'TravelerHome' : 'CustomerHome';
    navigation.reset({
      routes: [{ name: nextScreen }],
    });
  };


  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#E7FFF2', '#F8FFF9', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Static Decoration Background */}
      <View style={styles.decorationContainer}>
        <View style={styles.floatingDot} />
        <View style={styles.floatingSquare} />
        <View style={styles.floatingRing} />
        <View style={styles.radialGradientTop} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          
          {/* Success Illustration with Animated Tick */}
          <View style={styles.illustrationContainer}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Animated.View style={[
                  styles.iconBox, 
                  { 
                    transform: [{ scale: tickScale }],
                    opacity: tickOpacity
                  }
                ]}>
                  <Svg width="55" height="53" viewBox="0 0 55 53" fill="none">
                    <Path
                      d="M19 52.5L14.25 44.5L5.25 42.5L6.125 33.25L0 26.25L6.125 19.25L5.25 10L14.25 8L19 0L27.5 3.625L36 0L40.75 8L49.75 10L48.875 19.25L55 26.25L48.875 33.25L49.75 42.5L40.75 44.5L36 52.5L27.5 48.875L19 52.5ZM24.875 35.125L39 21L35.5 17.375L24.875 28L19.5 22.75L16 26.25L24.875 35.125Z"
                      fill="#94EAC9"
                    />
                  </Svg>
                </Animated.View>
              </View>
            </View>
          </View>

          {/* Static Content */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Verification Submitted!</Text>
            <Text style={styles.description}>
              Great news! Your details have been sent for review. We'll notify you as soon as your account is approved.
            </Text>
          </View>

          <View style={styles.timeCardContainer}>
            <View style={styles.timeCard}>
              <View style={styles.timeIconBox}>
                <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#00513D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M12 6V12L16 14" stroke="#00513D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </View>
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>ESTIMATED TIME</Text>
                <Text style={styles.timeValue}>Usually takes less than 24 hours.</Text>
              </View>
            </View>
          </View>

        </View>

        {/* Footer Action */}
        <View style={styles.footer}>
          <PrimaryButton 
            text="Go to Home" 
            onPress={handleGoHome}
            style={styles.homeButton}
          />
        </View>
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
  radialGradientTop: {
    position: 'absolute',
    top: -height * 0.15,
    alignSelf: 'center',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(157, 244, 210, 0.2)',
  },
  floatingDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9DF4D2',
    top: 80,
    right: 40,
    opacity: 0.4,
  },
  floatingSquare: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#CBE9DA',
    top: 240,
    left: 20,
    transform: [{ rotate: '15deg' }],
    opacity: 0.3,
  },
  floatingRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#9DF4D2',
    top: 380,
    right: 100,
    opacity: 0.2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 40 : 60,
  },
  illustrationContainer: {
    marginBottom: 24,
  },
  outerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#DCFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 44,
  },
  title: {
    fontSize: 34,
    color: '#052017',
    textAlign: 'center',
    fontFamily: Typography.extraBold,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 18,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 30,
    fontFamily: Typography.medium,
    opacity: 0.8,
  },
  timeCardContainer: {
    width: '100%',
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 108, 82, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  timeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#DCFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInfo: {
    flex: 1,
    gap: 2,
  },
  timeLabel: {
    fontSize: 10,
    color: 'rgba(0, 81, 61, 0.6)',
    letterSpacing: 0.5,
    fontFamily: Typography.bold,
  },
  timeValue: {
    fontSize: 16,
    color: '#052017',
    fontFamily: Typography.bold,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  homeButton: {
    height: 72,
    borderRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 12,
  },
});

export default VerificationSuccessScreen;
