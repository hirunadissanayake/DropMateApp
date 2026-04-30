import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, SafeAreaView, Animated, Easing, StatusBar, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { Typography } from '../constants/Typography';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const { height } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const SplashScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { token, user, _hasHydrated } = useAuthStore();
  
  // Entrance Animation Values
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  // Ripple Animation Values
  const ripple1Scale = useRef(new Animated.Value(1)).current;
  const ripple1Opacity = useRef(new Animated.Value(0.3)).current;
  const ripple2Scale = useRef(new Animated.Value(1)).current;
  const ripple2Opacity = useRef(new Animated.Value(0.3)).current;

  const styles = makeStyles(theme);

  useEffect(() => {
    // 1. Sleek Entrance Array
    Animated.parallel([
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Text slides up smoothly slightly later
    Animated.parallel([
      Animated.timing(textFade, {
        toValue: 1,
        duration: 700,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 700,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(footerFade, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();

    const checkNavigation = () => {
      const state = useAuthStore.getState();
      
      if (!state._hasHydrated) {
        setTimeout(checkNavigation, 50);
        return;
      }

      if (state.token && state.user) {
        if (state.user.roleActive === 'CUSTOMER') {
          navigation.replace('CustomerHome');
        } else if (state.user.roleActive === 'TRAVELER') {
          navigation.replace('TravelerHome');
        } else {
          navigation.replace('RoleSelection');
        }
      } else {
        navigation.replace('Login');
      }
    };

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      delay: 400,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false, 
    }).start(() => {
      checkNavigation();
    });

    // 2. Continual Ripple Pulse loop
    const createRipple = (scaleAnim: Animated.Value, opacityAnim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 2,
              duration: 2500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 2500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(scaleAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };

    createRipple(ripple1Scale, ripple1Opacity, 0);
    createRipple(ripple2Scale, ripple2Opacity, 1250); 

  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      <LinearGradient 
        colors={theme.isDark ? theme.bgGradient : ['#EBF8F2', '#FAFDFB']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.contentWrapper}>
        <View style={styles.content}>
          <View style={styles.logoAndTextContainer}>
            <Animated.View style={[styles.logoWrapper, { opacity: logoFade, transform: [{ scale: logoScale }] }]}>
              
              <Animated.View style={[styles.ripple, { transform: [{ scale: ripple1Scale }], opacity: ripple1Opacity }]} />
              <Animated.View style={[styles.ripple, { transform: [{ scale: ripple2Scale }], opacity: ripple2Opacity }]} />
              
              <Image
                source={require('../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />

            </Animated.View>

            <Animated.View style={[styles.textContainer, { opacity: textFade, transform: [{ translateY: textTranslateY }] }]}>
              <Text style={styles.title}>Drop Mate</Text>
              <Text style={styles.subtitle}>
                Deliver with trust, travel with value
              </Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.loadingContainer, { opacity: textFade }]}>
            <View style={styles.progressBarTrack}>
              <AnimatedLinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={[theme.primary, theme.primary]}
                style={[styles.progressBarFill, { width: progressWidth }]}
              />
            </View>
            <Text style={styles.initializingText}>INITIALIZING...</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footerContainer, { opacity: footerFade }]}>
          <Text style={styles.footerText}>VERIFIED LOGISTICS</Text>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>SRI LANKA</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  logoAndTextContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  ripple: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 108, 82, 0.08)',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: theme.primary,
    fontSize: 46,
    fontFamily: Typography.bold,
    lineHeight: 46,
    letterSpacing: -2.3,
  },
  subtitle: {
    color: theme.text.primary,
    fontSize: 16,
    fontFamily: Typography.regular,
    letterSpacing: -0.2,
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 70, 
  },
  progressBarTrack: {
    width: 200, 
    height: 4, 
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 108, 82, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  initializingText: {
    color: theme.text.secondary,
    fontSize: 12,
    fontFamily: Typography.bold,
    letterSpacing: 2.5,
    marginTop: 20,
  },
  footerContainer: {
    position: 'absolute',
    bottom: height * 0.06, 
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: theme.text.tertiary,
    fontSize: 12,
    fontFamily: Typography.bold,
    letterSpacing: 2.0,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.text.tertiary,
    marginHorizontal: 12,
  },
});

export default SplashScreen;
