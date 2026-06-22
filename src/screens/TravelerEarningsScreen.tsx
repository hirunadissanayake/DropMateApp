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
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect, LinearGradient as SvgGradient, Stop, Defs } from 'react-native-svg';

import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import { useIsFocused } from '@react-navigation/native';
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

type FilterPeriod = 'Today' | 'Last 30 Days' | 'All' | 'Custom';

const formatLKR = (amount: number) =>
  `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
};

const SkeletonItem = ({ style }: { style?: any }) => {
  const { theme } = useTheme();
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
          borderRadius: style?.borderRadius || 8,
          opacity,
        },
      ]}
    />
  );
};

const TravelerEarningsScreen = () => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const isFocused = useIsFocused();

  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Date filter state
  const [startDate, setStartDate] = useState<Date>(dayjs().subtract(1, 'month').toDate());
  const [endDate, setEndDate] = useState<Date>(dayjs().toDate());
  const [activePreset, setActivePreset] = useState<FilterPeriod>('Last 30 Days');

  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

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
      const filters = activePreset === 'All' ? {} : {
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
      // Fix: Extract transactions array from the paginated response
      setTransactions(txData.transactions || []);

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
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
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
  const displayEarned = summary?.periodEarned || 0;
  const displayCash = summary?.periodCashEarnings || 0;
  const displayOnline = summary?.periodOnlineEarnings || 0;
  const totalPayout = (summary?.totalEarned || 0) - (summary?.walletBalance || 0); // Approx total withdrawn + pending
  const displayPending = summary?.pendingWithdrawals || 0;

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

  const SkeletonItem = ({ style }: { style: any }) => {
    const { theme } = useTheme();
    return (
      <View style={[
        { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9', borderRadius: 12 },
        style
      ]} />
    );
  };

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.isDark ? theme.primary : '#fff'} colors={[theme.primary]} />}
      >
        {Platform.OS === 'ios' && (
          <View style={{
            position: 'absolute',
            top: -400,
            left: 0,
            right: 0,
            height: 400,
            backgroundColor: (loading && !refreshing) ? (theme.isDark ? '#05100C' : '#F8FAFC') : (theme.isDark ? '#05100C' : theme.primary),
          }} />
        )}

        {loading && !refreshing ? (
          <>
            <View style={[styles.heroSection, { backgroundColor: theme.isDark ? '#05100C' : '#F8FAFC', paddingBottom: 40 }]}>
              <SafeAreaView edges={['top']}>
                <View style={styles.headerRow}>
                  <BackButton color={theme.isDark ? '#FFFFFF' : theme.primary} onPress={() => navigation.goBack()} />
                  <Text style={[styles.headerTitle, { color: theme.isDark ? '#FFF' : theme.text.primary }]}>My Wallet</Text>
                  <View style={{ width: 40 }} />
                </View>
                <View style={[styles.balanceContainer, { marginTop: 30 }]}>
                  <SkeletonItem style={{ width: 100, height: 16, marginBottom: 12 }} />
                  <SkeletonItem style={{ width: 220, height: 44, marginBottom: 24, borderRadius: 22 }} />
                  <SkeletonItem style={{ width: 160, height: 48, borderRadius: 24 }} />
                </View>
              </SafeAreaView>
            </View>

            <View style={styles.contentBody}>
              <View style={[styles.datePickerContainer, { marginTop: 10 }]}>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <SkeletonItem style={{ flex: 1, height: 40 }} />
                  <SkeletonItem style={{ flex: 1, height: 40 }} />
                  <SkeletonItem style={{ flex: 1, height: 40 }} />
                </View>
                <SkeletonItem style={{ width: '100%', height: 52, borderRadius: 14 }} />
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statsCol}>
                  <View style={styles.statCard}>
                    <SkeletonItem style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 12 }} />
                    <SkeletonItem style={{ width: '70%', height: 12, marginBottom: 8 }} />
                    <SkeletonItem style={{ width: '90%', height: 24 }} />
                  </View>
                  <View style={[styles.statCard, { marginTop: 12 }]}>
                    <SkeletonItem style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 12 }} />
                    <SkeletonItem style={{ width: '70%', height: 12, marginBottom: 8 }} />
                    <SkeletonItem style={{ width: '90%', height: 24 }} />
                  </View>
                </View>
                <View style={styles.statsCol}>
                  <View style={styles.statCard}>
                    <SkeletonItem style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 12 }} />
                    <SkeletonItem style={{ width: '70%', height: 12, marginBottom: 8 }} />
                    <SkeletonItem style={{ width: '90%', height: 24 }} />
                  </View>
                  <View style={[styles.statCard, { marginTop: 12 }]}>
                    <SkeletonItem style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 12 }} />
                    <SkeletonItem style={{ width: '70%', height: 12, marginBottom: 8 }} />
                    <SkeletonItem style={{ width: '90%', height: 24 }} />
                  </View>
                </View>
              </View>

              <View style={[styles.totalPayoutCard, { alignItems: 'center' }]}>
                <SkeletonItem style={{ width: 44, height: 44, borderRadius: 14, marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonItem style={{ width: 80, height: 12, marginBottom: 8 }} />
                  <SkeletonItem style={{ width: 140, height: 20 }} />
                </View>
                <SkeletonItem style={{ width: 70, height: 40, borderRadius: 12 }} />
              </View>

              <SkeletonItem style={{ width: 180, height: 18, marginTop: 30, marginBottom: 20 }} />
              <View style={[styles.viewHistoryBtn, { padding: 12 }]}>
                 <SkeletonItem style={{ width: 44, height: 44, borderRadius: 14, marginRight: 12 }} />
                 <View style={{ flex: 1 }}>
                    <SkeletonItem style={{ width: 120, height: 14, marginBottom: 6 }} />
                    <SkeletonItem style={{ width: 160, height: 10 }} />
                 </View>
              </View>
            </View>
          </>
        ) : (
          <>
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
                  <Text style={styles.balanceLabel}>Available Payout</Text>
                  <Text style={styles.balanceAmount}>{formatLKR(summary?.walletBalance || 0)}</Text>

                  {(summary?.walletBalance || 0) < CONFIG.MIN_WITHDRAWAL_AMOUNT ? (
                    <View style={{ alignItems: 'center' }}>
                      <View style={styles.withdrawDisabledBtn}>
                        <Text style={styles.withdrawDisabledText}>Minimum {formatLKR(CONFIG.MIN_WITHDRAWAL_AMOUNT)} required to withdraw</Text>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.withdrawMainBtn}
                      onPress={() => setShowWithdrawModal(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.withdrawMainText}>Withdraw Funds</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </SafeAreaView>
            </LinearGradient>

            <View style={styles.contentBody}>
              <View style={styles.datePickerContainer}>
                <TouchableOpacity
                  style={[styles.filterTitleRow, { justifyContent: 'space-between', marginBottom: isFiltersExpanded ? 12 : 0 }]}
                  onPress={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={styles.filterIconBox}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5">
                        <Path d="M3 6h18M7 12h10M10 18h4" />
                      </Svg>
                    </View>
                    <Text style={styles.filterTitle}>Quick Filters</Text>
                  </View>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2.5" style={{ transform: [{ rotate: isFiltersExpanded ? '180deg' : '0deg' }] }}>
                    <Path d="M6 9l6 6 6-6" />
                  </Svg>
                </TouchableOpacity>

                {isFiltersExpanded && (
                  <>
                    <View style={styles.presetRow}>
                      {(['Today', 'Last 30 Days', 'All'] as FilterPeriod[]).map((p) => (
                        <TouchableOpacity
                           key={p}
                           style={[styles.presetChip, activePreset === p && styles.presetChipActive]}
                           onPress={() => setPreset(p)}
                        >
                           <Text style={[styles.presetChipText, activePreset === p && styles.presetChipTextActive]}>{p}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={{ height: 16 }} />
                    <View style={styles.dateButtonGrid}>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setStartDatePickerVisibility(true)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dateIconBox}>
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                            <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><Path d="M16 2v4M8 2v4M3 10h18" />
                          </Svg>
                        </View>
                        <View>
                          <Text style={styles.dateButtonLabel}>From</Text>
                          <Text style={styles.dateButtonValue}>{dayjs(startDate).format('DD MMM YYYY')}</Text>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.dateArrowBox}>
                        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="3">
                          <Path d="M5 12h14M12 5l7 7-7 7" />
                        </Svg>
                      </View>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setEndDatePickerVisibility(true)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dateIconBox}>
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                            <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><Path d="M16 2v4M8 2v4M3 10h18" />
                          </Svg>
                        </View>
                        <View>
                          <Text style={styles.dateButtonLabel}>To</Text>
                          <Text style={styles.dateButtonValue}>{dayjs(endDate).format('DD MMM YYYY')}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
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

              <View style={styles.statsGrid}>
                <View style={styles.statsCol}>
                  <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF' }]}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <Rect x="2" y="5" width="20" height="14" rx="2" />
                        <Path d="M2 10h20" />
                      </Svg>
                    </View>
                    <Text style={styles.statCardLabel}>Online Earned</Text>
                    <View style={{ minHeight: 32, justifyContent: 'center' }}>
                      {isFetching ? (
                        <SkeletonItem style={{ width: '80%', height: 24, borderRadius: 6 }} />
                      ) : (
                        <Text style={styles.statCardValue} numberOfLines={1}>
                          {formatLKR(displayOnline).replace('LKR ', '')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.statCard, { marginTop: 12 }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? 'rgba(234,179,8,0.1)' : '#FEF3C7' }]}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <Rect x="2" y="6" width="20" height="12" rx="2" />
                        <Circle cx="12" cy="12" r="3" />
                        <Path d="M6 12h.01M18 12h.01" />
                      </Svg>
                    </View>
                    <Text style={styles.statCardLabel}>Cash Collection</Text>
                    <View style={{ minHeight: 32, justifyContent: 'center' }}>
                      {isFetching ? (
                        <SkeletonItem style={{ width: '80%', height: 24, borderRadius: 6 }} />
                      ) : (
                        <Text style={styles.statCardValue} numberOfLines={1}>
                          {formatLKR(displayCash).replace('LKR ', '')}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.statsCol}>
                  <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5' }]}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M23 6l-9.5 9.5-5-5L1 18" /><Path d="M17 6h6v6" />
                      </Svg>
                    </View>
                    <Text style={styles.statCardLabel}>
                      {activePreset === 'Today' ? 'Today Earned' : activePreset === 'All' ? 'Total Earned' : 'Period Earned'}
                    </Text>
                    <View style={{ minHeight: 32, justifyContent: 'center' }}>
                      {isFetching ? (
                        <SkeletonItem style={{ width: '80%', height: 24, borderRadius: 6 }} />
                      ) : (
                        <Text style={styles.statCardValue} numberOfLines={1}>
                          {formatLKR(displayEarned).replace('LKR ', '')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.statCard, { marginTop: 12 }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? 'rgba(139,92,246,0.1)' : '#F3E8FF' }]}>
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M6 9V2h12v7" />
                        <Path d="M6 5H2v4c0 2.21 1.79 4 4 4" />
                        <Path d="M18 5h4v4c0 2.21-1.79 4-4 4" />
                        <Path d="M12 13v7" />
                        <Path d="M8 22h8" />
                      </Svg>
                    </View>
                    <Text style={styles.statCardLabel}>Lifetime Total</Text>
                    <View style={{ minHeight: 32, justifyContent: 'center' }}>
                      {isFetching ? (
                        <SkeletonItem style={{ width: '80%', height: 24, borderRadius: 6 }} />
                      ) : (
                        <Text style={styles.statCardValue} numberOfLines={1}>
                          {formatLKR(summary?.totalEarned || 0).replace('LKR ', '')}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.totalPayoutCard}>
                <View style={[styles.statIconContainer, { backgroundColor: theme.isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5', marginBottom: 0, marginRight: 16 }]}>
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <Path d="M2 17l10 5 10-5" />
                    <Path d="M2 12l10 5 10-5" />
                  </Svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.totalPayoutLabel}>Total Payout</Text>
                  {isFetching ? (
                    <SkeletonItem style={{ width: 120, height: 24, borderRadius: 6, marginTop: 4 }} />
                  ) : (
                    <Text style={styles.totalPayoutAmount}>
                      {formatLKR((summary?.totalWithdrawn || 0) + (summary?.pendingWithdrawals || 0))}
                    </Text>
                  )}
                </View>
                <View style={styles.totalPayoutBadge}>
                  <Text style={styles.totalPayoutBadgeText}>Pending</Text>
                  <Text style={[styles.totalPayoutBadgeText, { fontSize: 12, marginTop: 2 }]}>
                    {formatLKR(summary?.pendingWithdrawals || 0).replace('LKR ', '')}
                  </Text>
                </View>
              </View>

              <Text style={styles.recentTxTitle}>Recent Transactions</Text>

              <TouchableOpacity
                style={styles.viewHistoryBtn}
                onPress={() => navigation.navigate('EarningsHistory' as never)}
                activeOpacity={0.8}
              >
                <View style={styles.viewHistoryLeft}>
                  <View style={[styles.historyIconBg, { backgroundColor: theme.isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' }]}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <View style={{ height: 90 }} />
          </>
        )}
      </ScrollView>

      <Modal visible={showWithdrawModal} animationType="slide" transparent onRequestClose={() => setShowWithdrawModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWithdrawModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
            pointerEvents="box-none"
          >
            <TouchableWithoutFeedback onPress={() => { }}>
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
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};


function makeStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    heroSection: {
      paddingBottom: 24,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    headerTitle: { fontSize: 24, fontFamily: Typography.extraBold, color: '#FFFFFF' },
    balanceContainer: { alignItems: 'center', marginTop: 12, paddingHorizontal: 20 },
    balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: Typography.medium, marginBottom: 8 },
    balanceAmount: { fontSize: 36, color: '#FFFFFF', fontFamily: Typography.bold, letterSpacing: -1, marginBottom: 16 },
    withdrawMainBtn: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 100,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    withdrawMainText: { color: theme.primary, fontFamily: Typography.bold, fontSize: 14 },
    withdrawDisabledBtn: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    withdrawDisabledText: { color: 'rgba(255,255,255,0.6)', fontFamily: Typography.medium, fontSize: 12 },
    minPayoutWarning: { color: 'rgba(255,255,255,0.8)', fontFamily: Typography.medium, fontSize: 11 },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239,68,68,0.2)',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      marginTop: 16,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.4)',
      gap: 12,
      width: '100%',
    },
    blockWarning: { color: '#FECACA', fontFamily: Typography.bold, fontSize: 10, flex: 1 },
    topUpButtonSecondary: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    topUpButtonSecondaryText: { color: '#FFFFFF', fontFamily: Typography.bold, fontSize: 11 },

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
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.isDark ? 0.3 : 0.05,
      shadowRadius: 10,
      elevation: 4,
    },
    filterHeader: {
      marginBottom: 16,
    },
    filterTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    filterIconBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: theme.isDark ? 'rgba(0, 108, 82, 0.15)' : 'rgba(0, 108, 82, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterTitle: {
      fontSize: 14,
      fontFamily: Typography.bold,
      color: theme.text.primary,
    },
    dateButtonGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    dateIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    dateButtonLabel: {
      fontSize: 10,
      fontFamily: Typography.bold,
      color: theme.text.tertiary,
      textTransform: 'uppercase',
      marginBottom: 1,
    },
    dateButtonValue: {
      fontSize: 11,
      fontFamily: Typography.extraBold,
      color: theme.text.primary,
    },
    dateArrowBox: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetRow: {
      flexDirection: 'row',
      gap: 6,
    },
    presetChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    presetChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
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
    statCardValue: { fontSize: 18, color: theme.text.primary, fontFamily: Typography.extraBold, letterSpacing: -0.5 },

    // ── Total Payout Card ────────────────────────────────────────────────────
    totalPayoutCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
      flexDirection: 'row',
      alignItems: 'center',
    },
    totalPayoutLabel: {
      fontSize: 12,
      fontFamily: Typography.medium,
      color: theme.text.secondary,
      marginBottom: 4,
    },
    totalPayoutAmount: {
      fontSize: 20,
      fontFamily: Typography.extraBold,
      color: theme.text.primary,
      letterSpacing: -0.5,
    },
    totalPayoutBadge: {
      backgroundColor: theme.isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      alignItems: 'center',
      minWidth: 80,
    },
    totalPayoutBadgeText: {
      fontSize: 10,
      fontFamily: Typography.bold,
      color: theme.primary,
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

    // Modal 
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
