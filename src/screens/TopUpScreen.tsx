import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';
import BackButton from '../components/common/BackButton';
import { useAuthStore } from '../store/authStore';
import * as walletService from '../services/walletService';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { AppTheme } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const MIN_TOPUP = 500;

const TopUpScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { token, refreshUser } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [slipUri, setSlipUri] = useState<string | null>(null);

  const selectImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets && result.assets.length > 0) {
      setSlipUri(result.assets[0].uri || null);
    }
  };

  const handleTopUp = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) < MIN_TOPUP) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: `Minimum top-up amount is LKR ${MIN_TOPUP}`,
      });
      return;
    }
    if (!slipUri) {
      Toast.show({
        type: 'error',
        text1: 'No Slip Uploaded',
        text2: 'Please upload a photo of your deposit slip to continue',
      });
      return;
    }
    setLoading(true);
    try {
      await walletService.requestTopUp(token as string, { amount: Number(amount), slipUri });
      Toast.show({
        type: 'success',
        text1: 'Top-Up Request Sent ✅',
        text2: 'Our team will verify your slip and credit your wallet shortly.',
      });
      await refreshUser();
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Top-Up Failed',
        text2: error.message || 'Could not send the request. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isValidAmount = Number(amount) >= MIN_TOPUP;
  const progress = Math.min((Number(amount) / MIN_TOPUP) * 100, 100);

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[theme.primary, theme.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <BackButton color="#FFFFFF" onPress={() => navigation.goBack()} />
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Top Up Wallet</Text>
              <Text style={styles.headerSubtitle}>Settle your balance</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Step 1 — Bank Details */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Transfer to Our Bank Account</Text>
                <Text style={styles.stepSubtitle}>Use your banking app or walk-in transfer</Text>
              </View>
            </View>

            <View style={styles.bankBox}>
              {[
                { label: 'Bank', value: 'Commercial Bank' },
                { label: 'Account Name', value: 'DropMate (Pvt) Ltd' },
                { label: 'Account No', value: '1000 8820 9921', highlight: true },
                { label: 'Branch', value: 'Colombo 03' },
              ].map(({ label, value, highlight }) => (
                <View key={label} style={styles.bankRow}>
                  <Text style={styles.bankLabel}>{label}</Text>
                  <Text style={[styles.bankValue, highlight && { color: theme.primary, fontFamily: Typography.bold }]}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Step 2 — Amount */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Enter Deposited Amount</Text>
                <Text style={styles.stepSubtitle}>Must match your bank transfer exactly</Text>
              </View>
            </View>

            {/* Amount Input */}
            <View style={[styles.amountInputRow, isValidAmount && { borderColor: theme.primary }]}>
              <Text style={[styles.currencyLabel, { color: isValidAmount ? theme.primary : theme.text.tertiary }]}>LKR</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text.primary }]}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={theme.text.placeholder}
                value={amount}
                onChangeText={setAmount}
              />
              {isValidAmount && (
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 6L9 17l-5-5" />
                </Svg>
              )}
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` as any, backgroundColor: isValidAmount ? theme.primary : theme.primaryLight }]} />
            </View>

            {/* Min amount note */}
            <View style={styles.minNoteRow}>
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isValidAmount ? theme.primary : theme.text.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 16v-4M12 8h.01" />
              </Svg>
              <Text style={[styles.minNote, isValidAmount && { color: theme.primary }]}>
                Minimum top-up amount is LKR {MIN_TOPUP.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Step 3 — Slip Upload */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>Upload Deposit Slip</Text>
                <Text style={styles.stepSubtitle}>Screenshot or photo of the bank receipt</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={selectImage}
              style={[styles.uploadBox, slipUri && { borderColor: theme.primary, borderStyle: 'solid' }]}
              activeOpacity={0.8}
            >
              {slipUri ? (
                <View style={{ width: '100%', height: '100%' }}>
                  <Image source={{ uri: slipUri }} style={styles.slipImage} />
                  <View style={styles.changeOverlay}>
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </Svg>
                    <Text style={styles.changeText}>Tap to change</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={[styles.uploadIconBg, { backgroundColor: theme.primaryLight + '30' }]}>
                    <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <Path d="M17 8l-5-5-5 5" />
                      <Path d="M12 3v12" />
                    </Svg>
                  </View>
                  <Text style={[styles.uploadLabel, { color: theme.primary }]}>Select Image</Text>
                  <Text style={[styles.uploadHint, { color: theme.text.tertiary }]}>JPG, PNG up to 10MB</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Review Summary */}
          {isValidAmount && slipUri && (
            <View style={[styles.summaryCard, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '40' }]}>
              <Text style={[styles.summaryTitle, { color: theme.primary }]}>Ready to Submit</Text>
              <Text style={[styles.summaryText, { color: theme.text.secondary }]}>
                Amount: <Text style={{ fontFamily: Typography.bold, color: theme.text.primary }}>LKR {Number(amount).toLocaleString()}</Text>
              </Text>
              <Text style={[styles.summaryText, { color: theme.text.secondary, marginTop: 2 }]}>
                Slip attached and ready for admin review.
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: theme.primary },
              (!isValidAmount || !slipUri || loading) && { opacity: 0.45 }
            ]}
            onPress={handleTopUp}
            disabled={loading || !isValidAmount || !slipUri}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <Path d="M22 4L12 14.01l-3-3" />
                </Svg>
                <Text style={styles.submitText}>Submit Top-Up Request</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.footerNote, { color: theme.text.tertiary }]}>
            Your request will be reviewed within a few hours. Wallet credits are processed manually by the DropMate team.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: Typography.bold,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontFamily: Typography.medium,
    marginTop: 2,
  },
  scroll: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 50,
    gap: 16,
  },
  stepCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: theme.isDark ? '#000' : theme.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontFamily: Typography.bold,
    fontSize: 14,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: Typography.bold,
    color: theme.text.primary,
  },
  stepSubtitle: {
    fontSize: 12,
    fontFamily: Typography.medium,
    color: theme.text.tertiary,
    marginTop: 2,
  },
  bankBox: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#F7FCF9',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  bankLabel: {
    fontSize: 13,
    fontFamily: Typography.medium,
    color: theme.text.tertiary,
  },
  bankValue: {
    fontSize: 13,
    fontFamily: Typography.semiBold,
    color: theme.text.primary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 18,
    paddingHorizontal: 18,
    height: 64,
    gap: 10,
  },
  currencyLabel: {
    fontSize: 18,
    fontFamily: Typography.bold,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: Typography.bold,
    height: '100%',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#E5F5ED',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  minNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  minNote: {
    fontSize: 12,
    fontFamily: Typography.medium,
    color: theme.text.tertiary,
  },
  uploadBox: {
    height: 180,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.border,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#FAFFFE',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: {
    fontSize: 14,
    fontFamily: Typography.bold,
  },
  uploadHint: {
    fontSize: 11,
    fontFamily: Typography.medium,
  },
  slipImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: Typography.semiBold,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: Typography.medium,
  },
  submitBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  footerNote: {
    fontSize: 11,
    fontFamily: Typography.medium,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});

export default TopUpScreen;
