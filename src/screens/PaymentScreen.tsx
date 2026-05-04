import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import BackButton from '../components/common/BackButton';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as paymentService from '../services/paymentService';
import * as authService from '../services/authService';
import CustomAlert from '../components/common/CustomAlert';
import { ENDPOINTS } from '../utils/endPoints';

import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

// Import PayHere SDK
import PayHere from '@payhere/payhere-mobilesdk-reactnative';

const BRAND_GREEN = '#00875A';
const BRAND_DARK = '#004D3A';

export default function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Payment'>>();
  const { parcelId, amount } = route.params;
  const { token, user, setUser } = useAuthStore();
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
    onConfirm: () => {},
  });

  // Refresh user profile if missing email/phone
  React.useEffect(() => {
    const refreshProfile = async () => {
      if (token && (!user?.email || !user?.phone)) {
        try {
          const latestUser = await authService.getMe(token);
          setUser(latestUser);
        } catch (error) {
          console.error('Failed to refresh profile in PaymentScreen:', error);
        }
      }
    };
    refreshProfile();
  }, [token, user?.email, user?.phone]);

  // ── Polls the backend every 2s to verify the PayHere webhook was received ──
  const pollPaymentStatus = (maxRetries = 15) => {
    let retries = 0;
    setStatusText('Syncing with payment server...');

    const interval = setInterval(async () => {
      retries++;
      try {
        const { paymentStatus } = await paymentService.getPaymentStatus(token!, parcelId);

        if (paymentStatus === 'PAID') {
          clearInterval(interval);
          setIsProcessing(false);
          setStatusText('');
          setAlertConfig({
            visible: true,
            title: 'Payment Successful! 🎉',
            message: 'Your payment is confirmed and your parcel is now active.',
            type: 'success',
            onConfirm: () => {
              setAlertConfig(prev => ({ ...prev, visible: false }));
              navigation.goBack();
            },
          });
        } else if (paymentStatus === 'FAILED') {
          clearInterval(interval);
          setIsProcessing(false);
          setStatusText('');
          setAlertConfig({
            visible: true,
            title: 'Payment Failed',
            message: 'Your payment could not be processed. Please try again.',
            type: 'error',
            onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
          });
        }
      } catch (e) {
        console.error('Polling error:', e);
      }

      if (retries >= maxRetries) {
        clearInterval(interval);
        setIsProcessing(false);
        setStatusText('');
        setAlertConfig({
          visible: true,
          title: 'Verification Pending',
          message: 'Your payment is being processed. It will reflect in your shipment status shortly.',
          type: 'info',
          onConfirm: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            navigation.goBack();
          },
        });
      }
    }, 2000);
  };

  const handlePayHerePayment = async () => {
    setIsProcessing(true);
    setStatusText('Preparing secure gateway...');

    try {
      const hashData = await paymentService.generatePaymentHash(token!, parcelId);

      const paymentObject = {
        sandbox: hashData.sandbox,
        merchant_id: hashData.merchant_id,
        notify_url: ENDPOINTS.PAYMENT.WEBHOOK,
        order_id: hashData.order_id,
        items: 'DropMate Parcel Delivery',
        amount: hashData.amount,
        currency: hashData.currency,
        hash: hashData.hash,

        first_name: user?.name?.split(' ')[0] || 'Customer',
        last_name: user?.name?.split(' ').slice(1).join(' ') || 'User',
        email: user?.email || 'customer@dropmate.com',
        phone: user?.phone || '0770000000',
        address: user?.permanentAddress || 'Sri Lanka',
        city: user?.city || 'Colombo',
        country: 'Sri Lanka',
      };

      setStatusText('');

      PayHere.startPayment(
        paymentObject,
        (_paymentId: string) => {
          pollPaymentStatus();
        },
        (errorData) => {
          setIsProcessing(false);
          setStatusText('');
          setAlertConfig({
            visible: true,
            title: 'Payment Failed',
            message: errorData,
            type: 'error',
            onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
          });
        },
        () => {
          setIsProcessing(false);
          setStatusText('');
        }
      );

    } catch (error: any) {
      setIsProcessing(false);
      setStatusText('');
      setAlertConfig({
        visible: true,
        title: 'Initialization Error',
        message: error?.message || 'Could not connect to payment provider.',
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.summaryCard}>
             <Text style={styles.summaryLabel}>PAYMENT FOR</Text>
             <Text style={styles.parcelId}>Parcel #{parcelId.slice(-8).toUpperCase()}</Text>
             
             <View style={styles.divider} />
             
             <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Fee</Text>
                <Text style={styles.priceValue}>LKR {amount.toLocaleString()}</Text>
             </View>
             <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Processing Fee</Text>
                <Text style={styles.priceValue}>LKR 0.00</Text>
             </View>
             
             <View style={[styles.priceRow, { marginTop: 12 }]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>LKR {amount.toLocaleString()}</Text>
             </View>
          </View>

          <View style={styles.trustSection}>
             <Text style={styles.trustText}>ACCEPTED PAYMENT METHODS</Text>
             <View style={styles.methodRow}>
                <View style={styles.methodIcon}><Text style={styles.methodIconText}>VISA</Text></View>
                <View style={styles.methodIcon}><Text style={styles.methodIconText}>MC</Text></View>
                <View style={styles.methodIcon}><Text style={styles.methodIconText}>AMEX</Text></View>
                <View style={styles.methodIcon}><Text style={styles.methodIconText}>M-CASH</Text></View>
             </View>
             
             <View style={styles.infoBox}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text.secondary} strokeWidth="2">
                   <Circle cx="12" cy="12" r="10" /><Path d="M12 16v-4M12 8h.01" />
                </Svg>
                <Text style={styles.infoText}>
                   Your payment is processed securely via PayHere. We do not store your card details.
                </Text>
             </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.payButton, isProcessing && styles.payButtonDisabled]} 
            onPress={handlePayHerePayment}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={isProcessing ? (theme.isDark ? ['#334155', '#1E293B'] : ['#CBD5E1', '#94A3B8']) : [BRAND_GREEN, BRAND_DARK]} 
              style={styles.payGradient}
            >
              {isProcessing ? (
                <View style={styles.processingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" style={{ marginRight: 12 }} />
                  <Text style={styles.processingText}>{statusText || 'Processing...'}</Text>
                </View>
              ) : (
                <View style={styles.payBtnRow}>
                   <Text style={styles.payButtonText}>Pay LKR {amount.toLocaleString()}</Text>
                   <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                      <Path d="M5 12h14M12 5l7 7-7 7" />
                   </Svg>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.secureNote}>🔒 SSL SECURE PAYMENT</Text>
        </View>
      </SafeAreaView>

      <CustomAlert
        visible={alertConfig.visible}
        theme={theme}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText="Done"
        onConfirm={alertConfig.onConfirm}
        onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

function makeStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    safeArea: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { 
      fontSize: 24, 
      fontFamily: Typography.bold, 
      color: theme.text.primary 
    },
    scrollContent: { padding: 24 },
    summaryCard: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 32,
    },
    summaryLabel: { 
      fontSize: 11, 
      fontFamily: Typography.bold, 
      color: theme.text.tertiary,
      letterSpacing: 1,
      marginBottom: 8
    },
    parcelId: { 
      fontSize: 20, 
      fontFamily: Typography.bold, 
      color: theme.text.primary,
      marginBottom: 20
    },
    divider: { 
      height: 1, 
      backgroundColor: theme.border, 
      marginBottom: 20,
      borderStyle: 'dashed'
    },
    priceRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      marginBottom: 12 
    },
    priceLabel: { fontSize: 14, fontFamily: Typography.medium, color: theme.text.secondary },
    priceValue: { fontSize: 14, fontFamily: Typography.bold, color: theme.text.primary },
    totalLabel: { fontSize: 16, fontFamily: Typography.bold, color: theme.text.primary },
    totalValue: { fontSize: 22, fontFamily: Typography.bold, color: theme.primary },
    trustSection: { alignItems: 'center' },
    trustText: { 
      fontSize: 11, 
      fontFamily: Typography.bold, 
      color: theme.text.tertiary,
      letterSpacing: 1,
      marginBottom: 16
    },
    methodRow: { 
      flexDirection: 'row', 
      gap: 10, 
      marginBottom: 32 
    },
    methodIcon: {
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border
    },
    methodIconText: { fontSize: 10, fontFamily: Typography.bold, color: theme.text.secondary },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
      padding: 16,
      borderRadius: 16,
      gap: 12,
      alignItems: 'center'
    },
    infoText: { 
      flex: 1, 
      fontSize: 13, 
      color: theme.text.secondary, 
      fontFamily: Typography.medium,
      lineHeight: 18
    },
    footer: { 
      padding: 24, 
      borderTopWidth: 1, 
      borderTopColor: theme.border,
      backgroundColor: theme.background
    },
    payButton: { 
      borderRadius: 20, 
      overflow: 'hidden',
      marginBottom: 16
    },
    payButtonDisabled: { opacity: 0.8 },
    payGradient: { 
      paddingVertical: 18, 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    payBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    payButtonText: { 
      color: '#FFFFFF', 
      fontSize: 16, 
      fontFamily: Typography.bold 
    },
    processingRow: { flexDirection: 'row', alignItems: 'center' },
    processingText: { color: '#FFFFFF', fontSize: 14, fontFamily: Typography.medium },
    secureNote: { 
      textAlign: 'center', 
      fontSize: 11, 
      fontFamily: Typography.bold, 
      color: theme.text.tertiary,
      letterSpacing: 1
    },
  });
}
