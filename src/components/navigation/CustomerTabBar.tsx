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
import Svg, { Path, Circle } from 'react-native-svg';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/Colors';

const { width } = Dimensions.get('window');

const CustomerTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.tabBarWrapper}>
        <View style={s.tabBarContainer}>
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
                theme={theme}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const TabItem = ({ isFocused, label, routeName, onPress, theme }: any) => {
  const scaleAnim      = useRef(new Animated.Value(isFocused ? 1.08 : 1)).current;
  const opacityAnim    = useRef(new Animated.Value(isFocused ? 1 : 0.55)).current;
  const pillOpacity    = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const pillScale      = useRef(new Animated.Value(isFocused ? 1 : 0.7)).current;
  const dotOpacity     = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const dotScale       = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const translateYAnim = useRef(new Animated.Value(isFocused ? -2 : 0)).current;

  const s = makeStyles(theme);

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
      style={s.tabItem}
    >
      <Animated.View
        style={[
          s.tabContentContainer,
          { transform: [{ translateY: translateYAnim }] },
        ]}
      >
        <Animated.View
          style={[
            s.activePill,
            {
              opacity: pillOpacity,
              transform: [{ scale: pillScale }],
            },
          ]}
        />

        <Animated.View
          style={[
            s.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={s.iconWrapper}>
            {renderIcon(routeName, isFocused, theme)}
          </View>
        </Animated.View>

        <Text
          style={[
            s.tabLabel,
            {
              color: isFocused ? theme.primary : theme.text.tertiary,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        <Animated.View
          style={[
            s.indicatorDot,
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

const renderIcon = (routeName: string, isFocused: boolean, theme: AppTheme) => {
  const color = isFocused ? theme.primary : theme.text.tertiary;
  const sw    = isFocused ? '2.4' : '2';
  const size  = 22;
  const fillColor = isFocused ? `${theme.primary}22` : 'none';

  if (routeName === 'Home') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor}>
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
  if (routeName === 'My Trips') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {isFocused && (
          <Circle cx="15" cy="10" r="2" fill={theme.primary} />
        )}
      </Svg>
    );
  }
  if (routeName === 'Shipments' || routeName === 'Services') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor}>
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
  if (routeName === 'Find Parcels' || routeName === 'Find Travelers') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor}>
        <Path
          d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
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
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor}>
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
  if (routeName === 'Requests') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor}>
        <Path
          d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.73 21a2 2 0 0 1-3.46 0"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return null;
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 26 : 14,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  tabBarWrapper: {
    width: '100%',
    backgroundColor: theme.isDark ? 'rgba(13, 31, 24, 0.96)' : 'rgba(235, 248, 242, 0.97)',
    borderRadius: 28,
    shadowColor: theme.isDark ? '#000' : theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: theme.isDark ? 0.3 : 0.18,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 135, 90, 0.14)',
    overflow: 'hidden',
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
  activePill: {
    position: 'absolute',
    top: '18%',
    width: 52,
    height: 48,
    borderRadius: 16,
    shadowColor: theme.primary,
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
    fontFamily: Typography.bold,
    letterSpacing: 0,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  indicatorDot: {
    position: 'absolute',
    bottom: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
});

export default CustomerTabBar;
