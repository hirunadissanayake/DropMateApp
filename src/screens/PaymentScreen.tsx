import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import BackButton from '../components/common/BackButton';
import LinearGradient from 'react-native-linear-gradient';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as paymentService from '../services/paymentService';
import CustomAlert from '../components/common/CustomAlert';

// Import PayHere SDK
import PayHere from '@payhere/payhere-mobilesdk-reactnative';

export default function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Payment'>>();
  const { parcelId, amount } = route.params;
  const { token } = useAuthStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
    onConfirm: () => {},
  });

  // ── Polls the backend every 2s to verify the PayHere webhook was received ──
  const pollPaymentStatus = (maxRetries = 10) => {
    let retries = 0;
    setStatusText('Verifying payment...');

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

      // Stop polling after max retries to avoid infinite loop
      if (retries >= maxRetries) {
        clearInterval(interval);
        setIsProcessing(false);
        setStatusText('');
        setAlertConfig({
          visible: true,
          title: 'Verification Timeout',
          message: 'We could not verify your payment automatically. Please check your parcel status.',
          type: 'info',
          onConfirm: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            navigation.goBack();
          },
        });
      }
    }, 2000); // Poll every 2 seconds
  };

  const handlePayHerePayment = async () => {
    setIsProcessing(true);
    setStatusText('Preparing payment...');

    try {
      // ── Step 1: Fetch the secure hash from our backend ──
      const hashData = await paymentService.generatePaymentHash(token!, parcelId);

      // ── Step 2: Build the PayHere payment object ──
      const paymentObject = {
        sandbox: hashData.sandbox,
        merchant_id: hashData.merchant_id,
        notify_url: 'https://drop-mate.onrender.com/api/payment/webhook',
        order_id: hashData.order_id,
        items: 'DropMate Parcel Delivery',
        amount: hashData.amount,      // Already formatted as "1000.00" from backend
        currency: hashData.currency,
        hash: hashData.hash,          // Cryptographically signed by our backend

        // Customer details — hardcoded for now, can be fetched from user profile later
        first_name: 'Customer',
        last_name: 'DropMate',
        email: 'customer@dropmate.com',
        phone: '0771234567',
        address: 'Colombo',
        city: 'Colombo',
        country: 'Sri Lanka',
      };

      setStatusText('');

      // ── Step 3: Launch the PayHere SDK ──
      PayHere.startPayment(
        paymentObject,
        (_paymentId: string) => {
          // ✅ PayHere SDK says "success" — but we trust our backend webhook, not this callback.
          // Start polling the backend to confirm the webhook was received.
          pollPaymentStatus();
        },
        (errorData) => {
          // ❌ PayHere reported an error
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
          // 🚪 User closed the PayHere sheet without paying
          setIsProcessing(false);
          setStatusText('');
        }
      );

    } catch (error: any) {
      setIsProcessing(false);
      setStatusText('');
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: error?.message || 'Could not initialize payment. Please try again.',
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total to Pay</Text>
          <Text style={styles.amountValue}>LKR {amount.toLocaleString()}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            You will be redirected to the secure PayHere payment gateway. You can pay using your Visa, Mastercard, EzCash, or mCash.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]} 
          onPress={handlePayHerePayment}
          disabled={isProcessing}
        >
          <LinearGradient 
            colors={isProcessing ? ['#94A3B8', '#64748B'] : ['#006C52', '#004D3A']} 
            style={styles.payGradient}
          >
            {isProcessing ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator color="#FFFFFF" />
                {statusText ? (
                  <Text style={[styles.payButtonText, { fontSize: 12, marginTop: 6, opacity: 0.8 }]}>
                    {statusText}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.payButtonText}>Proceed to PayHere</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText="OK"
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.bold,
    color: '#0F172A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 40,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  amountLabel: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: Typography.medium,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 42,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  infoText: {
    fontSize: 15,
    color: '#475569',
    fontFamily: Typography.medium,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.bold,
  },
});
