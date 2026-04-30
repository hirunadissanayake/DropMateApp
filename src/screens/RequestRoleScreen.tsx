import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, AppTheme } from '../constants/Colors';
import PrimaryButton from '../components/common/PrimaryButton';
import CustomDropdown from '../components/common/CustomDropdown';
import ScreenHeader from '../components/common/ScreenHeader';
import { useAuthStore } from '../store/authStore';
import * as authService from '../services/authService';
import Toast from 'react-native-toast-message';
import { Typography } from '../constants/Typography';
import { useTheme } from '../context/ThemeContext';

const RequestRoleScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user, token, setUser } = useAuthStore();
  
  // Determine target role (the one they DON'T have yet)
  const targetRole = user?.roleActive === 'CUSTOMER' ? 'TRAVELER' : 'CUSTOMER';
  const [loading, setLoading] = useState(false);
  const isFormValid = true; 

  const styles = makeStyles(theme);

  const handleSubmit = async () => {
    if (!token || !isFormValid) return;

    setLoading(true);
    try {
      const requestData: any = {
        role: targetRole,
      };
      
      const response = await authService.requestNewRole(token, requestData);
      
      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: response?.message || `Your request to become a ${targetRole.toLowerCase()} has been submitted.`,
      });
      
      if (response.user) {
        setUser(response.user);
      }
      
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={theme.isDark ? theme.bgGradient : Colors.bgGradient}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Blur Circles */}
      <View style={[styles.decorCircle, { top: -50, right: -50, backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#D1FAE5', opacity: 0.6 }]} />
      <View style={[styles.decorCircle, { bottom: 100, left: -80, backgroundColor: theme.isDark ? 'rgba(5, 150, 105, 0.05)' : '#ECFDF5', opacity: 0.4 }]} />

      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          onBack={() => navigation.goBack()} 
          title={targetRole === 'TRAVELER' ? "Become a Traveler" : "Become a Customer"}
          theme={theme}
        />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>
                {targetRole === 'TRAVELER' ? 'Start Earning while Traveling' : 'Start Shipping Parcels'}
            </Text>
            <Text style={styles.subtitle}>
              {targetRole === 'TRAVELER' 
                ? 'Join our network of travelers and earn money by delivering parcels on your existing journeys.'
                : 'Become a customer to send parcels securely with our verified network of travelers.'}
            </Text>
          </View>

          <View style={styles.roleCard}>
              <LinearGradient
                colors={theme.isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#FFFFFF', '#F8FAFC']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.roleHeader}>
                  <View style={[styles.iconBox, { backgroundColor: theme.primary }]}>
                      {targetRole === 'TRAVELER' ? (
                          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <Path d="M22 10v6M2 10v6M22 10l-10-8-10 8M2 10l10 8 10-8" />
                          </Svg>
                      ) : (
                          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <Path d="M21 8V21H3V8M1 3H23V8H1V3ZM10 12H14" />
                          </Svg>
                      )}
                  </View>
                  <View style={{ flex: 1 }}>
                      <Text style={styles.roleLabel}>Target Role</Text>
                      <Text style={styles.roleValue}>{targetRole}</Text>
                  </View>
                  <View style={styles.statusIndicator}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Requesting</Text>
                  </View>
              </View>
              <View style={styles.infoBadge}>
                  <View style={styles.infoIconWrapper}>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5">
                        <Circle cx="12" cy="12" r="10" />
                        <Path d="M12 16V12M12 8H12.01" />
                    </Svg>
                  </View>
                  <Text style={styles.infoText}>Your existing verification documents will be used.</Text>
              </View>
          </View>

          {targetRole === 'TRAVELER' && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>HOW IT WORKS</Text>
                <View style={styles.headerLine} />
              </View>
              
              <View style={styles.stepsRow}>
                <View style={styles.stepItem}>
                  <View style={styles.stepIconBox}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </Svg>
                  </View>
                  <Text style={styles.stepText}>Verified Profile</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepItem}>
                  <View style={styles.stepIconBox}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <Circle cx="9" cy="7" r="4" />
                      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </Svg>
                  </View>
                  <Text style={styles.stepText}>Manual Audit</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepItem}>
                  <View style={styles.stepIconBox}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                      <Circle cx="12" cy="12" r="10" />
                      <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <Path d="M9 9h.01" />
                      <Path d="M15 9h.01" />
                    </Svg>
                  </View>
                  <Text style={styles.stepText}>Start Earning</Text>
                </View>
              </View>
            </View>
          )}

          {targetRole === 'CUSTOMER' && (
              <View style={styles.confirmationCard}>
                  <View style={styles.confirmIconBox}>
                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5">
                      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <Path d="M22 4L12 14.01l-3-3" />
                    </Svg>
                  </View>
                  <Text style={styles.confirmTitle}>Enable Customer Features</Text>
                  <Text style={styles.confirmText}>
                      Post shipments and track deliveries with our verified network of travelers.
                  </Text>
              </View>
          )}

          <View style={styles.footer}>
            <PrimaryButton 
              text={targetRole === 'TRAVELER' ? "Submit Traveler Request" : "Enable Customer Role"} 
              onPress={handleSubmit}
              loading={loading}
              disabled={!isFormValid}
              theme={theme}
            />
            <View style={styles.disclaimerRow}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 8v4l3 3" />
              </Svg>
              <Text style={styles.disclaimer}>
                  Requests are typically processed within 24 hours.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 },
  decorCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  titleSection: { marginBottom: 32 },
  mainTitle: {
    fontSize: 28,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: theme.text.secondary,
    lineHeight: 22,
    fontFamily: Typography.medium,
    textAlign: 'center',
  },
  roleCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 32,
    shadowColor: theme.isDark ? '#000' : theme.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    backgroundColor: theme.card,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 11,
    color: theme.text.tertiary,
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  roleValue: {
    fontSize: 20,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
  },
  statusText: {
    fontSize: 11,
    color: theme.text.secondary,
    fontFamily: Typography.bold,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  infoIconWrapper: {
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 108, 82, 0.05)',
    padding: 4,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    color: theme.primary,
    fontFamily: Typography.bold,
    flex: 1,
  },
  section: { marginBottom: 32 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontFamily: Typography.extraBold,
    letterSpacing: 0.5,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  confirmationCard: {
    padding: 32,
    backgroundColor: theme.card,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 10,
  },
  confirmIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 108, 82, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    color: theme.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Typography.extraBold,
  },
  confirmText: {
    fontSize: 14,
    color: theme.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: Typography.medium,
  },
  footer: { 
    marginTop: 10,
    gap: 16,
    alignItems: 'center',
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  stepIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0, 108, 82, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 10,
    fontFamily: Typography.extraBold,
    color: theme.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  stepLine: {
    width: 20,
    height: 1,
    backgroundColor: theme.border,
    marginTop: -20,
  },
});

export default RequestRoleScreen;
