import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as walletService from '../services/walletService';
import { WalletSummary, WalletTransaction } from '../services/walletService';
import * as bankService from '../services/bankService';
import { BankDetail } from '../services/bankService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import BackButton from '../components/common/BackButton';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';
import { CONFIG } from '../constants/Config';
import dayjs from 'dayjs';

import DateTimePickerModal from 'react-native-modal-datetime-picker';

const { width } = Dimensions.get('window');

type FilterPeriod = 'Today' | 'Last 30 Days' | 'Total' | 'Custom';

const formatLKR = (amount: number) =>
  `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TravelerEarningsScreen = () => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation();
  const { token } = useAuthStore();

  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  // Date filter state
  const [startDate, setStartDate] = useState<Date>(dayjs().subtract(1, 'month').toDate());
  const [endDate, setEndDate] = useState<Date>(dayjs().toDate());
  const [activePreset, setActivePreset] = useState<FilterPeriod>('Last 30 Days');
  
  // Date picker visibility
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Saved bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankDetail[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!loading) setIsFetching(true);
    try {
      const filters = activePreset === 'Total' ? {} : {
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD'),
      };

      const [summaryData, bankData, txData] = await Promise.all([
        walletService.getWalletSummary(token!, filters),
        bankService.getBankDetails(token!),
        walletService.getTransactionHistory(token!, { ...filters, limit: 10 }),
      ]);
      setSummary(summaryData);
      setBankAccounts(bankData);
      setTransactions(txData);

      if (bankData.length > 0 && !selectedBankId) {
        const defaultBank = bankData.find(b => b.isDefault) || bankData[0];
        setSelectedBankId(defaultBank.id);
      }
    } catch (error) {
      console.error('Wallet/Bank fetch error:', error);
    } finally {
      setLoading(false);
      setIsFetching(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
  }, [token, startDate, endDate, activePreset]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const setPreset = (preset: FilterPeriod) => {
    setActivePreset(preset);
    if (preset === 'Today') {
      setStartDate(dayjs().startOf('day').toDate());
      setEndDate(dayjs().endOf('day').toDate());
    } else if (preset === 'Last 30 Days') {
      setStartDate(dayjs().subtract(30, 'days').toDate());
      setEndDate(dayjs().toDate());
    }
    // Total handled by fetchData having empty filters
  };

  const handleConfirmStartDate = (date: Date) => {
    setStartDate(date);
    setStartDatePickerVisibility(false);
    setActivePreset('Custom');
  };

  const handleConfirmEndDate = (date: Date) => {
    setEndDate(date);
    setEndDatePickerVisibility(false);
    setActivePreset('Custom');
  };

  // Stats derived directly from summary
  const displayEarned    = summary?.periodEarned || 0;
  const displayCash      = summary?.periodCashEarnings || 0;
  const displayOnline    = summary?.periodOnlineEarnings || 0;
  const totalPayout      = (summary?.totalEarned || 0) - (summary?.walletBalance || 0); // Approx total withdrawn + pending
  const displayPending   = summary?.pendingWithdrawals || 0;

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid amount' });
      return;
    }
    if (amount > (summary?.walletBalance || 0)) {
      Toast.show({ type: 'error', text1: 'Insufficient balance' });
      return;
    }
    if (!selectedBankId) {
      Toast.show({ type: 'error', text1: 'Please select a payout method' });
      return;
    }
    setIsWithdrawing(true);
    try {
      const payload: any = { amount, bankDetailId: selectedBankId };
      const result = await walletService.requestWithdrawal(token!, payload);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      Toast.show({ type: 'success', text1: 'Withdrawal Requested', text2: result.message });
      fetchData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: error?.message || 'Could not process withdrawal' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getTxTypeColor = (tx: WalletTransaction) => {
    if (tx.type === 'DELIVERY_EARNED') return '#10B981';
    if (tx.status === 'PENDING') return '#F59E0B';
    if (tx.status === 'FAILED') return '#EF4444';
    return '#3B82F6';
  };

  const getTxLabel = (tx: WalletTransaction) => {
    if (tx.type === 'DELIVERY_EARNED') return 'Delivery Earned';
    if (tx.type === 'WITHDRAWAL' && tx.status === 'PENDING') return 'Withdrawal · Pending';
    if (tx.type === 'WITHDRAWAL' && tx.status === 'COMPLETED') return 'Withdrawal · Completed';
    return tx.type.replace('_', ' ');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.isDark ? theme.primary : '#fff'} colors={[theme.primary]} />}
          >
            {/* ── Hero Header ─────────────────────────────────────────── */}
            <LinearGradient
              colors={theme.isDark ? ['#05100C', '#0D1F18'] : [theme.primary, theme.primaryDark]}
              style={styles.heroSection}
            >
              <SafeAreaView edges={['top']}>
                <View style={styles.headerRow}>
                  <BackButton color="#FFFFFF" onPress={() => navigation.goBack()} />
                  <Text style={styles.headerTitle}>My Wallet</Text>
                  <View style={{ width: 40 }} />
                </View>

                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Available for Payout</Text>
                  <Text style={styles.balanceAmount}>{formatLKR(summary?.walletBalance || 0)}</Text>

                  <TouchableOpacity
                    style={[styles.withdrawMainBtn, (summary?.walletBalance || 0) < CONFIG.MIN_WITHDRAWAL_AMOUNT && { opacity: 0.5 }]}
                    onPress={() => (summary?.walletBalance || 0) >= CONFIG.MIN_WITHDRAWAL_AMOUNT && setShowWithdrawModal(true)}
                    activeOpacity={(summary?.walletBalance || 0) >= CONFIG.MIN_WITHDRAWAL_AMOUNT ? 0.8 : 1}
                  >
                    <Text style={styles.withdrawMainText}>Request Payout</Text>
                  </TouchableOpacity>

                  {(summary?.walletBalance || 0) < 0 ? (
                    <View style={{ alignItems: 'center' }}>
                      <View style={styles.warningBox}>
                        <Text style={styles.blockWarning}>
                          Warning: Your balance is negative. Reaching LKR {Math.abs(CONFIG.WALLET_BLOCK_THRESHOLD)} negative will result in an account block.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.topUpButtonSmall}
                        onPress={() => navigation.navigate('TopUp' as never)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.topUpButtonSmallText}>Top Up Wallet</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (summary?.walletBalance || 0) < CONFIG.MIN_WITHDRAWAL_AMOUNT ? (
                    <Text style={styles.minPayoutWarning}>
                      Minimum LKR {CONFIG.MIN_WITHDRAWAL_AMOUNT} required for payout
                    </Text>
                  ) : null}
                </View>
              </SafeAreaView>
            </LinearGradient>

            <View style={styles.contentBody}>

              {/* ── Date Range Pickers ───────────────────────────────── */}
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity 
                    style={styles.dateButton} 
                    onPress={() => setStartDatePickerVisibility(true)}
                  >
                    <Text style={styles.dateButtonLabel}>Start Date</Text>
                    <Text style={styles.dateButtonValue}>{dayjs(startDate).format('DD MMM YYYY')}</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.dateSeparator}>
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                      <Path d="M5 12h14" />
                    </Svg>
                  </View>

                  <TouchableOpacity 
                    style={styles.dateButton} 
                    onPress={() => setEndDatePickerVisibility(true)}
                  >
                    <Text style={styles.dateButtonLabel}>End Date</Text>
                    <Text style={styles.dateButtonValue}>{dayjs(endDate).format('DD MMM YYYY')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.presetRow}>
                  {(['Today', 'Last 30 Days', 'Total'] as FilterPeriod[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.presetChip, activePreset === p && styles.presetChipActive]}
                      onPress={() => setPreset(p)}
                    >
                      <Text style={[styles.presetChipText, activePreset === p && styles.presetChipTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <DateTimePickerModal
                isVisible={isStartDatePickerVisible}
                mode="date"
                date={startDate}
                onConfirm={handleConfirmStartDate}
                onCancel={() => setStartDatePickerVisibility(false)}
                textColor={theme.isDark ? '#FFFFFF' : '#000000'}
                maximumDate={endDate || new Date()}
              />
              <DateTimePickerModal
                isVisible={isEndDatePickerVisible}
                mode="date"
                date={endDate}
                onConfirm={handleConfirmEndDate}
                onCancel={() => setEndDatePickerVisibility(false)}
                textColor={theme.isDark ? '#FFFFFF' : '#000000'}
                minimumDate={startDate}
                maximumDate={new Date()}
              />

              {/* ── Stats Grid ───────────────────────────────────────── */}
              <View style={styles.statsGrid}>
                <View style={styles.statsCol}>
                  {/* Card Payments */}
                  <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF' }]}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><Path d="M3 5v14a2 2 0 0 0 2 2h16v-5H5a2 2 0 0 1 0-4h16z" />
                      </Svg>
                    </View>
                    <Text style={styles.statCardLabel}>Online Earned</Text>
                    <View style={{ minHeight: 32, justifyContent: 'center' }}>
                      {isFetching ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <Text style={styles.statCardValue} numberOfLines={1}>
                          {formatLKR(displayOnline).replace('LKR ', '')}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Cash Collection */}
                  <View style={[styles.statCard, { marginTop: 12 }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? 'rgba(234,179,8,0.1)' : '#FEF3C7' }]}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Circle cx="12" cy="12" r="10" /><Path d="M12 6v12M9 9h6M9 15h6" />
                      </Svg>
                    </View>
                    <Text style={styles.statCardLabel}>Cash Collection</Text>
                    <View style={{ minHeight: 32, justifyContent: 'center' }}>
                      {isFetching ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <Text style={styles.statCardValue} numberOfLines={1}>
                          {formatLKR(displayCash).replace('LKR ', '')}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.statsCol}>
                  {/* Dynamic Period Earned */}
                  <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5' }]}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M23 6l-9.5 9.5-5-5L1 18" /><Path d="M17 6h6v6" />
                      </Svg>
                    </View>
                    <Text style={styles.statCardLabel}>
                      {activePreset === 'Today' ? 'Today Earned' : activePreset === 'Total' ? 'Total Earned' : 'Period Earned'}
                    </Text>
                    <View style={{ minHeight: 32, justifyContent: 'center' }}>
                      {isFetching ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <Text style={styles.statCardValue} numberOfLines={1}>
                          {formatLKR(displayEarned).replace('LKR ', '')}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Lifetime Total */}
                  <View style={[styles.statCard, { marginTop: 12 }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? 'rgba(139,92,246,0.1)' : '#F3E8FF' }]}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </Svg>
                    </View>
                    <Text style={styles.statCardLabel}>Lifetime Total</Text>
                    <View style={{ minHeight: 32, justifyContent: 'center' }}>
                      {isFetching ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <Text style={styles.statCardValue} numberOfLines={1}>
                          {formatLKR(summary?.totalEarned || 0).replace('LKR ', '')}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* ── Total Payout Card ─────────────────────────────────── */}
              <View style={styles.totalPayoutCard}>
                <LinearGradient
                  colors={theme.isDark ? ['#0D1F18', '#152B21'] : ['#F0FFF8', '#E6FBF2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.totalPayoutGradient}
                >
                  <View style={styles.totalPayoutLeft}>
                    <View style={[styles.totalPayoutIconBox, { backgroundColor: theme.isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' }]}>
                      <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <Path d="M2 17l10 5 10-5" />
                        <Path d="M2 12l10 5 10-5" />
                      </Svg>
                    </View>
                    <View>
                      <Text style={styles.totalPayoutLabel}>Total Payout</Text>
                      <Text style={styles.totalPayoutSubLabel}>
                        {formatLKR(summary?.pendingWithdrawals || 0)} pending
                      </Text>
                    </View>
                  </View>
                  <View style={styles.totalPayoutRight}>
                    {isFetching ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Text style={styles.totalPayoutAmount}>
                        {formatLKR((summary?.totalWithdrawn || 0) + (summary?.pendingWithdrawals || 0))}
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </View>

              {/* ── Recent Transactions Heading ───────────────────────── */}
              <Text style={styles.recentTxTitle}>Recent Transactions</Text>

              {/* ── View Earnings History ─────────────────────────────── */}
              <TouchableOpacity
                style={styles.viewHistoryBtn}
                onPress={() => navigation.navigate('EarningsHistory' as never)}
                activeOpacity={0.8}
              >
                <View style={styles.viewHistoryLeft}>
                  <View style={[styles.historyIconBg, { backgroundColor: theme.isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF' }]}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </Svg>
                  </View>
                  <View>
                    <Text style={styles.viewHistoryTitle}>Earnings History</Text>
                    <Text style={styles.viewHistorySub}>View all past transactions</Text>
                  </View>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 18l6-6-6-6" />
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>

          {/* ── Withdrawal Modal ──────────────────────────────────────── */}
          <Modal visible={showWithdrawModal} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIndicator} />
                  <Text style={styles.modalTitle}>Withdrawal Request</Text>
                  <Text style={styles.modalSubtitle}>Funds will be sent to your bank account</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Amount to Withdraw</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={withdrawAmount}
                      onChangeText={setWithdrawAmount}
                      placeholderTextColor={theme.text.placeholder}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.bankHeaderRow}>
                      <Text style={styles.inputLabel}>Payout Method</Text>
                      <TouchableOpacity onPress={() => { setShowWithdrawModal(false); navigation.navigate('BankDetails' as never); }}>
                        <Text style={styles.manageBanksText}>Manage Accounts</Text>
                      </TouchableOpacity>
                    </View>

                    {bankAccounts.length > 0 ? (
                      <View style={styles.bankSelector}>
                        {bankAccounts.map((bank) => (
                          <TouchableOpacity
                            key={bank.id}
                            style={[styles.bankSelectOption, selectedBankId === bank.id && styles.bankSelectOptionActive]}
                            onPress={() => setSelectedBankId(bank.id)}
                          >
                            <View style={[styles.radioCircle, selectedBankId === bank.id && styles.radioCircleActive]}>
                              {selectedBankId === bank.id && <View style={styles.radioInner} />}
                            </View>
                            <View style={styles.bankSelectInfo}>
                              <Text style={styles.bankSelectName}>{bank.bankName}</Text>
                              <Text style={styles.bankSelectAcc}>Acc: {bank.accountNumber}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.noBanksBtn}
                        onPress={() => { setShowWithdrawModal(false); navigation.navigate('BankDetails' as never); }}
                      >
                        <Text style={styles.noBanksText}>+ Add Saved Bank Account</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.infoNotice}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text.secondary} strokeWidth="2">
                      <Circle cx="12" cy="12" r="10" /><Path d="M12 16v-4M12 8h.01" />
                    </Svg>
                    <Text style={styles.infoNoticeText}>
                      Withdrawals are typically processed within 48 hours.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.confirmBtn, isWithdrawing && { opacity: 0.6 }]}
                    onPress={handleWithdraw}
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.confirmBtnText}>Confirm Withdrawal</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWithdrawModal(false)}>
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </>
      )}
    </View>
  );
};

function makeStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    heroSection: {
      paddingBottom: 40,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerTitle: { fontSize: 28, fontFamily: Typography.extraBold, color: '#FFFFFF' },
    balanceContainer: { alignItems: 'center', marginTop: 20, paddingHorizontal: 20 },
    balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: Typography.medium, marginBottom: 8 },
    balanceAmount: { fontSize: 36, color: '#FFFFFF', fontFamily: Typography.bold, marginBottom: 24, letterSpacing: -1 },
    withdrawMainBtn: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 40,
      paddingVertical: 14,
      borderRadius: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    withdrawMainText: { color: theme.primary, fontFamily: Typography.bold, fontSize: 15 },
    minPayoutWarning: { color: 'rgba(255,255,255,0.8)', fontFamily: Typography.medium, fontSize: 11, marginTop: 10 },
    warningBox: {
      backgroundColor: 'rgba(239,68,68,0.15)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      marginTop: 14,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.3)',
    },
    blockWarning: { color: '#FECACA', fontFamily: Typography.bold, fontSize: 11, textAlign: 'center' },
    topUpButtonSmall: {
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    topUpButtonSmallText: { color: '#FFFFFF', fontFamily: Typography.bold, fontSize: 13 },

    contentBody: { paddingHorizontal: 16, marginTop: -20 },

    // ── Date Range Pickers ──────────────────────────────────────────────────
    datePickerContainer: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: 10,
    },
    datePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    dateButton: {
      flex: 1,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    dateButtonLabel: {
      fontSize: 10,
      fontFamily: Typography.bold,
      color: theme.text.tertiary,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    dateButtonValue: {
      fontSize: 13,
      fontFamily: Typography.bold,
      color: theme.text.primary,
    },
    dateSeparator: {
      paddingHorizontal: 4,
    },
    presetRow: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 8,
    },
    presetChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.border,
    },
    presetChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    presetChipText: {
      fontSize: 11,
      fontFamily: Typography.bold,
      color: theme.text.secondary,
    },
    presetChipTextActive: {
      color: '#FFFFFF',
    },
    recentTxTitle: {
      fontSize: 15,
      fontFamily: Typography.bold,
      color: theme.text.primary,
      marginBottom: 12,
      marginTop: 8,
    },
    gridLoaderOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
      zIndex: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardRefetchOverlay: {
      position: 'absolute',
      right: 10,
      top: 10,
    },

    // ── Stats Grid ──────────────────────────────────────────────────────────
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statsCol: { flex: 1 },
    statCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
      marginTop: -10,
    },
    statIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statCardLabel: { fontSize: 12, color: theme.text.secondary, fontFamily: Typography.medium, marginBottom: 4 },
    statCardValue: { fontSize: 20, color: theme.text.primary, fontFamily: Typography.extraBold, letterSpacing: -0.5 },

    // ── Total Payout Card ────────────────────────────────────────────────────
    totalPayoutCard: {
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(16,185,129,0.2)' : '#A7F3D0',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 3,
    },
    totalPayoutGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
    },
    totalPayoutLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      flex: 1,
    },
    totalPayoutIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    totalPayoutLabel: {
      fontSize: 14,
      fontFamily: Typography.bold,
      color: theme.text.primary,
      marginBottom: 2,
    },
    totalPayoutSubLabel: {
      fontSize: 11,
      fontFamily: Typography.medium,
      color: theme.text.secondary,
      flexShrink: 1,
    },
    totalPayoutRight: {
      alignItems: 'flex-end',
      gap: 6,
    },
    totalPayoutAmount: {
      fontSize: 22,
      fontFamily: Typography.extraBold,
      color: theme.primary,
      letterSpacing: -0.5,
    },
    pendingBadge: {
      backgroundColor: theme.isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A',
      top: 12,
    },
    pendingBadgeText: {
      fontSize: 10,
      fontFamily: Typography.bold,
      color: '#D97706',
      
    },

    // ── Transactions ─────────────────────────────────────────────────────────
    txSection: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    txSectionTitle: {
      fontSize: 13,
      fontFamily: Typography.extraBold,
      color: theme.text.tertiary,
      letterSpacing: 0.5,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 12,
    },
    txDot: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txInfo: { flex: 1 },
    txLabel: { fontSize: 14, fontFamily: Typography.bold, color: theme.text.primary, marginBottom: 2 },
    txDate: { fontSize: 11, fontFamily: Typography.medium, color: theme.text.tertiary },
    txAmount: { fontSize: 15, fontFamily: Typography.extraBold },
    emptyTx: {
      alignItems: 'center',
      paddingVertical: 32,
      gap: 10,
      marginBottom: 8,
    },
    emptyTxText: {
      fontSize: 14,
      fontFamily: Typography.medium,
      color: theme.text.tertiary,
    },

    // ── History Button ───────────────────────────────────────────────────────
    viewHistoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
      marginBottom: 16,
    },
    viewHistoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    historyIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    viewHistoryTitle: { fontSize: 16, fontFamily: Typography.bold, color: theme.text.primary, marginBottom: 2 },
    viewHistorySub: { fontSize: 13, fontFamily: Typography.medium, color: theme.text.secondary },

    // ── Modal ────────────────────────────────────────────────────────────────
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      padding: 24,
      maxHeight: '85%',
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { marginBottom: 24 },
    modalTitle: { fontSize: 22, fontFamily: Typography.bold, color: theme.text.primary, marginBottom: 4 },
    modalSubtitle: { fontSize: 14, fontFamily: Typography.medium, color: theme.text.secondary },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontFamily: Typography.bold, color: theme.text.secondary, marginBottom: 8 },
    modalInput: {
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 14,
      fontSize: 15,
      fontFamily: Typography.medium,
      color: theme.text.primary,
    },
    infoNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
      padding: 12,
      borderRadius: 12,
      marginBottom: 24,
      gap: 10,
    },
    infoNoticeText: { flex: 1, fontSize: 12, color: theme.text.secondary, fontFamily: Typography.medium, lineHeight: 18 },
    confirmBtn: { backgroundColor: theme.primary, borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
    confirmBtnText: { color: '#FFFFFF', fontFamily: Typography.bold, fontSize: 16 },
    cancelBtn: { alignItems: 'center', paddingVertical: 12 },
    cancelBtnText: { color: theme.text.tertiary, fontFamily: Typography.bold, fontSize: 15 },
    bankHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    manageBanksText: { fontSize: 12, color: theme.primary, fontFamily: Typography.bold },
    bankSelector: { gap: 10 },
    bankSelectOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 14,
    },
    bankSelectOptionActive: { borderColor: theme.primary, backgroundColor: theme.isDark ? 'rgba(61,217,164,0.05)' : '#F0FDF4' },
    radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    radioCircleActive: { borderColor: theme.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },
    bankSelectInfo: { flex: 1 },
    bankSelectName: { fontSize: 14, fontFamily: Typography.bold, color: theme.text.primary },
    bankSelectAcc: { fontSize: 12, fontFamily: Typography.medium, color: theme.text.secondary },
    noBanksBtn: {
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
      padding: 16,
      borderRadius: 16,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    noBanksText: { fontSize: 14, fontFamily: Typography.bold, color: theme.primary },
  });
}

export default TravelerEarningsScreen;
