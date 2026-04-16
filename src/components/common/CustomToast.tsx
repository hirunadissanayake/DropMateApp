import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { Colors } from '../../constants/Colors';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={[styles.toastBase, styles.successToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={[styles.toastBase, styles.errorToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={[styles.toastBase, styles.infoToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
    />
  )
};

const styles = StyleSheet.create({
  toastBase: {
    minHeight: 75,
    height: 'auto',
    paddingVertical: 12,
    borderLeftWidth: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginHorizontal: 20,
    width: '90%',
  },
  successToast: {
    borderLeftColor: Colors.primary,
  },
  errorToast: {
    borderLeftColor: '#FF4D4D',
  },
  infoToast: {
    borderLeftColor: '#3498DB',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  text1: {
    fontSize: 16,
    fontWeight: '700',
    color: '#052017',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  text2: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
});
