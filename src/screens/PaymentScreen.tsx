import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Svg, { Path, Rect } from 'react-native-svg';
import BackButton from '../components/common/BackButton';
import LinearGradient from 'react-native-linear-gradient';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as parcelService from '../services/parcelService';
import CustomAlert from '../components/common/CustomAlert';

export default function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Payment'>>();
  const { parcelId, amount } = route.params;
  const { token } = useAuthStore();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
    onConfirm: () => {},
  });

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    setCardNumber(match ? match.join(' ') : cleaned);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvc || !name) {
      setAlertConfig({
        visible: true,
        title: 'Missing Fields',
        message: 'Please fill in all card details to proceed.',
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate real Stripe Gateway processing delay
    setTimeout(async () => {
      try {
        await parcelService.payParcel(token!, parcelId);
        setAlertConfig({
          visible: true,
          title: 'Payment Successful',
          message: 'Your payment was processed securely via Stripe.',
          type: 'success',
          onConfirm: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            navigation.goBack(); // Return to Parcel Details
          },
        });
      } catch (error: any) {
        setAlertConfig({
          visible: true,
          title: 'Payment Failed',
          message: error.message || 'The payment could not be processed.',
          type: 'error',
          onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        });
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={styles.headerTitle}>Card Payment</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total to Pay</Text>
            <Text style={styles.amountValue}>LKR {amount.toLocaleString()}</Text>
          </View>

          <View style={styles.cardPreview}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeaderRow}>
                <Svg width="40" height="24" viewBox="0 0 24 24" fill="none">
                  <Rect x="2" y="5" width="20" height="14" rx="2" fill="#E2E8F0" />
                  <Rect x="2" y="9" width="20" height="3" fill="#94A3B8" />
                </Svg>
                <Text style={styles.cardLogo}>STRIPE</Text>
              </View>
              
              <Text style={styles.cardNumberPreview}>
                {cardNumber || '**** **** **** ****'}
              </Text>
              
              <View style={styles.cardFooterRow}>
                <View>
                  <Text style={styles.cardLabelPreview}>Card Holder</Text>
                  <Text style={styles.cardValuePreview}>{name.toUpperCase() || 'YOUR NAME'}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabelPreview}>Expires</Text>
                  <Text style={styles.cardValuePreview}>{expiry || 'MM/YY'}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <View style={styles.inputWithIcon}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={styles.inputIcon}>
                  <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <Path d="M1 10h22" />
                </Svg>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChangeText={formatCardNumber}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={5}
                  value={expiry}
                  onChangeText={formatExpiry}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>CVC</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={cvc}
                  onChangeText={setCvc}
                />
              </View>
            </View>
            
            <View style={styles.secureBadge}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </Svg>
              <Text style={styles.secureText}>Payments are secure and encrypted by Stripe</Text>
            </View>

          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.payButton, isProcessing && styles.payButtonDisabled]} 
            onPress={handlePayment}
            disabled={isProcessing}
          >
            <LinearGradient 
              colors={isProcessing ? ['#94A3B8', '#64748B'] : ['#006C52', '#004D3A']} 
              style={styles.payGradient}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.payButtonText}>Pay LKR {amount.toLocaleString()}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
  scrollContent: {
    paddingBottom: 40,
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
  amountContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: Typography.medium,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  cardPreview: {
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogo: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: Typography.bold,
    letterSpacing: 2,
    fontSize: 16,
  },
  cardNumberPreview: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: Typography.medium,
    letterSpacing: 3,
    marginTop: 20,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cardLabelPreview: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontFamily: Typography.regular,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardValuePreview: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Typography.bold,
    letterSpacing: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: Typography.medium,
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.regular,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  row: {
    flexDirection: 'row',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secureText: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: Typography.medium,
    marginLeft: 6,
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
