import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CONFIG } from '../constants/Config';

const BlockedScreen = () => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isWalletBlocked = (user?.walletBalance ?? 0) < CONFIG.WALLET_BLOCK_THRESHOLD;

  const handleContactSupport = () => {
    navigation.navigate('SupportChat');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} translucent backgroundColor="transparent" />
      <LinearGradient
        colors={theme.isDark ? ['rgba(239, 68, 68, 0.05)', theme.background] : ['#FEF2F2', '#FFF1F2', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
                <Svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Circle cx="12" cy="12" r="10" />
                    <Path d="m4.9 4.9 14.2 14.2" />
                </Svg>
            </View>
          </View>

          <Text style={styles.title}>{isWalletBlocked ? "Wallet Suspended" : "Account Restricted"}</Text>
          <Text style={styles.subtitle}>
            {isWalletBlocked 
              ? "Your account has been automatically suspended due to a low wallet balance."
              : "Your access to DropMate has been restricted by the administration."}
          </Text>

          <View style={styles.reasonCard}>
            <Text style={styles.reasonLabel}>REASON FOR BLOCK:</Text>
            <Text style={styles.reasonText}>
              {isWalletBlocked 
                ? `Negative Balance: LKR ${user?.walletBalance}. Please settle your outstanding commissions (limit: LKR ${CONFIG.WALLET_BLOCK_THRESHOLD}).`
                : `"${user?.blockReason || 'Violation of Platform Terms & Conditions.'}"`}
            </Text>
          </View>

          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>
              Please contact support to resolve this issue and restore your account access.
            </Text>
            
            {(user?.walletBalance ?? 0) < 0 && (
              <TouchableOpacity 
                style={[styles.topUpButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('TopUp')}
                activeOpacity={0.8}
              >
                <Text style={styles.topUpText}>Top Up Now</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.contactBtn} onPress={handleContactSupport}>
                <Text style={styles.contactBtnText}>Contact Support Team</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
            <Text style={styles.footerText}>DROP MATE SECURITY SYSTEM</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA',
  },
  title: {
    fontSize: 28,
    fontFamily: Typography.extraBold,
    color: theme.isDark ? '#FCA5A5' : '#991B1B',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Typography.medium,
    color: theme.isDark ? '#FCA5A5' : '#7F1D1D',
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 40,
    lineHeight: 24,
  },
  reasonCard: {
    width: '100%',
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
    shadowColor: '#991B1B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 30,
  },
  reasonLabel: {
    fontSize: 12,
    fontFamily: Typography.extraBold,
    color: theme.isDark ? '#F87171' : '#B91C1C',
    letterSpacing: 1,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 16,
    fontFamily: Typography.bold,
    color: theme.text.primary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  instructionBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: Typography.medium,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactBtnText: {
    color: '#FFF',
    fontFamily: Typography.bold,
    fontSize: 14,
  },
  logoutBtn: {
    padding: 10,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: Typography.bold,
    color: theme.isDark ? '#FCA5A5' : '#991B1B',
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontFamily: Typography.semiBold,
    color: theme.border,
    letterSpacing: 2,
  },
  topUpButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  topUpText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Typography.bold,
  },
});

export default BlockedScreen;
