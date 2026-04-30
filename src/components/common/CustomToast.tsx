import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/Colors';
import Svg, { Path, Circle } from 'react-native-svg';

const SuccessIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="10" r="10" fill={color} fillOpacity="0.15" />
    <Path d="M14 7L8.5 12.5L6 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ErrorIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="10" r="10" fill={color} fillOpacity="0.15" />
    <Path d="M13 7L7 13M7 7L13 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const InfoIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="10" r="10" fill={color} fillOpacity="0.15" />
    <Path d="M10 14V10M10 6H10.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const themedToastConfig = (theme: AppTheme) => {
  const styles = makeStyles(theme);
  
  return {
    success: (props: any) => (
      <View style={[styles.toastBase, styles.successToast]}>
        <View style={styles.iconWrapper}>
          <SuccessIcon color={theme.primary} />
        </View>
        <View style={styles.contentContainer}>
          {props.text1 && <Text style={styles.text1} numberOfLines={1}>{props.text1}</Text>}
          {props.text2 && <Text style={styles.text2} numberOfLines={2}>{props.text2}</Text>}
        </View>
      </View>
    ),
    error: (props: any) => (
      <View style={[styles.toastBase, styles.errorToast]}>
        <View style={styles.iconWrapper}>
          <ErrorIcon color="#FF4D4D" />
        </View>
        <View style={styles.contentContainer}>
          {props.text1 && <Text style={styles.text1} numberOfLines={1}>{props.text1}</Text>}
          {props.text2 && <Text style={styles.text2} numberOfLines={2}>{props.text2}</Text>}
        </View>
      </View>
    ),
    info: (props: any) => (
      <View style={[styles.toastBase, styles.infoToast]}>
        <View style={styles.iconWrapper}>
          <InfoIcon color="#3498DB" />
        </View>
        <View style={styles.contentContainer}>
          {props.text1 && <Text style={styles.text1} numberOfLines={1}>{props.text1}</Text>}
          {props.text2 && <Text style={styles.text2} numberOfLines={2}>{props.text2}</Text>}
        </View>
      </View>
    )
  };
};

export const CustomToast = () => {
  return null;
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  toastBase: {
    width: '90%',
    minHeight: 70,
    backgroundColor: theme.isDark ? '#1C2E26' : '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(61, 217, 164, 0.15)' : 'rgba(0, 0, 0, 0.05)',
    shadowColor: theme.isDark ? '#000' : theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: theme.isDark ? 0.4 : 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  successToast: {
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  errorToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF4D4D',
  },
  infoToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text1: {
    fontSize: 15,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 2,
  },
  text2: {
    fontSize: 12,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
    opacity: 0.8,
  },
});

export { themedToastConfig };
