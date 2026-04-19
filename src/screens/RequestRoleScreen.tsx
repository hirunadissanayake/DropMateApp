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
import { Colors } from '../constants/Colors';
import PrimaryButton from '../components/common/PrimaryButton';
import CustomDropdown from '../components/common/CustomDropdown';
import ScreenHeader from '../components/common/ScreenHeader';
import { useAuthStore } from '../store/authStore';
import * as authService from '../services/authService';
import Toast from 'react-native-toast-message';
import { Typography } from '../constants/Typography';

const RequestRoleScreen = ({ navigation }: any) => {
  const { user, token, setUser } = useAuthStore();
  
  // Determine target role (the one they DON'T have yet)
  // If they are CUSTOMER, they want to be TRAVELER.
  // If they are TRAVELER, they want to be CUSTOMER.
  const targetRole = user?.roleActive === 'CUSTOMER' ? 'TRAVELER' : 'CUSTOMER';
  
  const [loading, setLoading] = useState(false);



  const isFormValid = true; // Always valid to request a role if the button is enabled

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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={Colors.bgGradient}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Blur Circles */}
      <View style={[styles.decorCircle, { top: -50, right: -50, backgroundColor: '#D1FAE5', opacity: 0.6 }]} />
      <View style={[styles.decorCircle, { bottom: 100, left: -80, backgroundColor: '#ECFDF5', opacity: 0.4 }]} />

      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          onBack={() => navigation.goBack()} 
          title={targetRole === 'TRAVELER' ? "Become a Traveler" : "Become a Customer"}
        />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            {/* <View style={styles.badge}>
              <Text style={styles.badgeText}>OPPORTUNITY</Text>
            </View> */}
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
                colors={['#FFFFFF', '#F8FAFC']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.roleHeader}>
                  <View style={[styles.iconBox, { backgroundColor: targetRole === 'TRAVELER' ? Colors.primary : '#00513D' }]}>
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
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2.5">
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
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2">
                      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </Svg>
                  </View>
                  <Text style={styles.stepText}>Verified Profile</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepItem}>
                  <View style={styles.stepIconBox}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2">
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
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2">
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
                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="1.5">
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
            />
            <View style={styles.disclaimerRow}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
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

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 },
  decorCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  badge: {
    backgroundColor: 'rgba(0, 108, 82, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  titleSection: { marginBottom: 32 },
  mainTitle: {
    fontSize: 32,
    color: Colors.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 12,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
    fontFamily: Typography.regular,
    textAlign: 'center',
  },
  roleCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
    marginBottom: 32,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roleLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  roleValue: {
    fontSize: 20,
    color: Colors.text.primary,
    fontFamily: Typography.bold,
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontFamily: Typography.bold,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.03)',
  },
  infoIconWrapper: {
    backgroundColor: 'rgba(0, 108, 82, 0.05)',
    padding: 4,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: Typography.medium,
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
    fontSize: 13,
    color: Colors.text.primary,
    fontFamily: Typography.bold,
    letterSpacing: 0.3,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailsCard: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: { gap: 8 },
  inputLabel: { 
    fontSize: 13, 
    fontFamily: Typography.bold, 
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 64,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: Colors.text.primary,
    fontFamily: Typography.bold,
  },
  unitBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  unitText: {
    fontSize: 13,
    fontFamily: Typography.bold,
    color: Colors.text.tertiary,
  },
  confirmationCard: {
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 10,
  },
  confirmIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 108, 82, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Typography.bold,
  },
  confirmText: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
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
    fontSize: 13,
    color: Colors.text.tertiary,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 108, 82, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 11,
    fontFamily: Typography.bold,
    color: Colors.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  stepLine: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(0, 108, 82, 0.1)',
    marginTop: -20,
  },
});

export default RequestRoleScreen;
