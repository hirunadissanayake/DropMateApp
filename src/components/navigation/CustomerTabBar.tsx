import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

// ─── Brand colours ───────────────────────────────────────────────────────────
const BRAND_GREEN   = '#00875A';   // primary active colour
const BRAND_LIGHT   = '#E6F5EF';   // pill background (active)
const BRAND_GLOW    = '#00875A30'; // box-shadow tint
const INACTIVE_CLR  = '#111111';   // inactive icon / label
const BAR_BG        = 'rgba(235, 248, 242, 0.97)'; // greenish-white bar

// ─── Main component ──────────────────────────────────────────────────────────
const CustomerTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabBarWrapper}>
        {/* Top accent line */}
        <View style={styles.topAccent} />

        <View style={styles.tabBarContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabItem
                key={route.key}
                isFocused={isFocused}
                label={label as string}
                routeName={route.name}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

// ─── Tab item ────────────────────────────────────────────────────────────────
const TabItem = ({ isFocused, label, routeName, onPress }: any) => {
  const scaleAnim      = useRef(new Animated.Value(isFocused ? 1.08 : 1)).current;
  const opacityAnim    = useRef(new Animated.Value(isFocused ? 1 : 0.55)).current;
  const pillOpacity    = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const pillScale      = useRef(new Animated.Value(isFocused ? 1 : 0.7)).current;
  const dotOpacity     = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const dotScale       = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  const translateYAnim = useRef(new Animated.Value(isFocused ? -2 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.08 : 1,
        useNativeDriver: true,
        friction: 5,
        tension: 45,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0.55,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(pillScale, {
        toValue: isFocused ? 1 : 0.7,
        useNativeDriver: true,
        friction: 5,
        tension: 50,
      }),
      Animated.timing(pillOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(dotScale, {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: true,
        friction: 5,
        tension: 60,
      }),
      Animated.timing(dotOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: isFocused ? -2 : 0,
        useNativeDriver: true,
        friction: 6,
        tension: 45,
      }),
    ]).start();
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.tabContentContainer,
          { transform: [{ translateY: translateYAnim }] },
        ]}
      >
        {/* Active pill background */}
        <Animated.View
          style={[
            styles.activePill,
            {
              opacity: pillOpacity,
              transform: [{ scale: pillScale }],
            },
          ]}
        />

        {/* Icon — scale + opacity applied here only */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.iconWrapper}>
            {renderIcon(routeName, isFocused)}
          </View>
        </Animated.View>

        {/* Label — plain Text, color-only transition, never blurs */}
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? BRAND_GREEN : INACTIVE_CLR,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {/* Indicator dot */}
        <Animated.View
          style={[
            styles.indicatorDot,
            {
              opacity: dotOpacity,
              transform: [{ scale: dotScale }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const renderIcon = (routeName: string, isFocused: boolean) => {
  const color = isFocused ? BRAND_GREEN : INACTIVE_CLR;
  const sw    = isFocused ? '2.4' : '2';
  const size  = 22;

  if (routeName === 'Home') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={isFocused ? `${BRAND_GREEN}22` : 'none'}>
        <Path
          d="M3 9.5L12 3L21 9.5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9.5Z"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 21V12H15V21"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (routeName === 'Shipments') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={isFocused ? `${BRAND_GREEN}22` : 'none'}>
        <Path
          d="M21 8L12 3L3 8V16L12 21L21 16V8Z"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M3 8L12 13L21 8"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 21V13"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (routeName === 'Wallet') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={isFocused ? `${BRAND_GREEN}22` : 'none'}>
        <Rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M2 10H22"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 14H18"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (routeName === 'Profile') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={isFocused ? `${BRAND_GREEN}22` : 'none'}>
        <Path
          d="M20 21V19C20 17.8954 19.1046 17 18 17H6C4.89543 17 4 17.8954 4 19V21"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx="12"
          cy="7"
          r="4"
          stroke={color}
          strokeWidth={sw}
        />
      </Svg>
    );
  }
  return null;
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 26 : 14,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  tabBarWrapper: {
    width: '100%',
    backgroundColor: BAR_BG,
    borderRadius: 28,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 135, 90, 0.14)',
    overflow: 'hidden',
  },
  // Thin green line across the very top of the bar
  topAccent: {
    height: 2.5,
    width: '38%',
    alignSelf: 'center',
    backgroundColor: BRAND_GREEN,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    opacity: 0.35,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  // Rounded green pill behind the active icon
  activePill: {
    position: 'absolute',
    top: '18%',
    width: 52,
    height: 48,
    borderRadius: 16,
    backgroundColor: BRAND_LIGHT,
    // inner glow
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrapper: {
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Manrope-Bold' : 'Manrope-Bold',
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Small glowing dot below active tab
  indicatorDot: {
    position: 'absolute',
    bottom: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: BRAND_GREEN,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
});

export default CustomerTabBar;
