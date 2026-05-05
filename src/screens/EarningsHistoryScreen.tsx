import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  RefreshControl,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as walletService from '../services/walletService';
import { WalletTransaction } from '../services/walletService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import BackButton from '../components/common/BackButton';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';
import dayjs from 'dayjs';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const formatLKR = (amount: number) =>
  `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
};

type FilterPeriod = 'Today' | 'Last 30 Days' | 'Total' | 'Custom';

export default function EarningsHistoryScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation();
  const { token } = useAuthStore();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Date filter state
  const [startDate, setStartDate] = useState<Date>(dayjs().subtract(1, 'month').toDate());
  const [endDate, setEndDate] = useState<Date>(dayjs().toDate());
  const [activePreset, setActivePreset] = useState<FilterPeriod>('Last 30 Days');
  
  // Date picker visibility
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const filters = activePreset === 'Total' ? {} : {
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD'),
      };
      
      const txData = await walletService.getTransactionHistory(token!, filters);
      setTransactions(txData);
    } catch (error) {
      console.error('Wallet tx fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchTransactions();
  }, [token, startDate, endDate, activePreset]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Earnings History</Text>
          <View style={{ width: 40 }} />
        </View>

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

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.isDark ? theme.primary : "#94A3B8"} />}
          >
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.isDark ? theme.primary : "#FFFFFF"} strokeWidth="1.5">
                     <Circle cx="12" cy="12" r="10" /><Path d="M12 8v8M8 12h8" />
                  </Svg>
                </View>
                <Text style={styles.emptyText}>No earnings yet</Text>
                <Text style={styles.emptySubText}>Completed deliveries will show up here</Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <TouchableOpacity 
                  key={tx.id} 
                  style={styles.transactionItem}
                  onPress={() => setSelectedTx(tx)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.txIconBg, { 
                    backgroundColor: tx.type === 'DELIVERY_EARNED' 
                      ? (theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5') 
                      : (theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FFF1F2')
                  }]}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                      stroke={tx.type === 'DELIVERY_EARNED' ? (theme.isDark ? '#3DD9A4' : theme.primary) : '#EF4444'} strokeWidth="2.5">
                      {tx.type === 'DELIVERY_EARNED' ? <Path d="M12 19V5M5 12l7-7 7 7" /> : <Path d="M12 5v14M5 12l7 7 7-7" />}
                    </Svg>
                  </View>
                  
                  <View style={styles.txMain}>
                    <Text style={styles.txDesc} numberOfLines={1}>{tx.description || 'Earnings'}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                    {tx.status === 'PENDING' && <Text style={styles.pendingText}>Processing</Text>}
                  </View>

                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { 
                      color: tx.type === 'DELIVERY_EARNED' ? (theme.isDark ? '#3DD9A4' : '#059669') : theme.text.primary
                    }]}>
                      {tx.type === 'DELIVERY_EARNED' ? '+' : '-'}{formatLKR(tx.amount).replace('LKR ', '')}
                    </Text>
                    <Text style={styles.txCurrency}>LKR</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Transaction Detail Modal */}
      <Modal visible={!!selectedTx} animationType="fade" transparent onRequestClose={() => setSelectedTx(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackground} onPress={() => setSelectedTx(null)} />
          
          <View style={styles.detailSheet}>
            <View style={styles.modalIndicator} />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.detailHeader}>
                <View style={[styles.txIconBgLarge, { 
                  backgroundColor: selectedTx?.type === 'DELIVERY_EARNED' 
                    ? (theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5') 
                    : (theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FFF1F2')
                }]}>
                  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" 
                    stroke={selectedTx?.type === 'DELIVERY_EARNED' ? (theme.isDark ? '#3DD9A4' : theme.primary) : '#EF4444'} strokeWidth="2.5">
                    {selectedTx?.type === 'DELIVERY_EARNED' ? <Path d="M12 19V5M5 12l7-7 7 7" /> : <Path d="M12 5v14M5 12l7 7 7-7" />}
                  </Svg>
                </View>
                <Text style={styles.detailType}>
                  {selectedTx?.type === 'DELIVERY_EARNED' 
                    ? 'Delivery Earnings' 
                    : selectedTx?.type === 'WITHDRAWAL' 
                    ? 'Withdrawal Payout' 
                    : 'Platform Fee'}
                </Text>
                <Text style={[styles.detailAmount, { 
                   color: selectedTx?.type === 'DELIVERY_EARNED' 
                     ? (theme.isDark ? '#3DD9A4' : theme.primary) 
                     : '#EF4444'
                }]}>
                  {selectedTx?.type === 'DELIVERY_EARNED' ? '+' : '-'}{formatLKR(selectedTx?.amount || 0)}
                </Text>
                
                <View style={[styles.detailStatusBadge, { 
                  backgroundColor: selectedTx?.status === 'COMPLETED' 
                    ? (theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#DCFCE7') 
                    : selectedTx?.status === 'PENDING' 
                    ? (theme.isDark ? 'rgba(234, 179, 8, 0.1)' : '#FEF3C7') 
                    : (theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2')
                }]}>
                  <Text style={[styles.detailStatusText, { 
                    color: selectedTx?.status === 'COMPLETED' 
                      ? (theme.isDark ? '#3DD9A4' : '#166534') 
                      : selectedTx?.status === 'PENDING' 
                      ? (theme.isDark ? '#EAB308' : '#92400E') 
                      : '#EF4444'
                  }]}>
                    {selectedTx?.status}
                  </Text>
                </View>
              </View>

              <View style={styles.detailBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {selectedTx ? new Date(selectedTx.createdAt).toLocaleString('en-LK', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : ''}
                  </Text>
                </View>
                
                <View style={styles.detailDivider} />
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedTx?.description || 'No description provided'}</Text>
                </View>

                <View style={styles.detailDivider} />
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValueSmall}>{selectedTx?.id}</Text>
                </View>

                {selectedTx?.parcel?.paymentMethod && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment Method</Text>
                      <Text style={styles.detailValue}>
                        {selectedTx.parcel.paymentMethod === 'ONLINE' 
                          ? 'Online Payment' 
                          : selectedTx.parcel.paymentMethod === 'CASH_ON_PICKUP' 
                          ? 'Cash on Pickup' 
                          : 'Cash on Delivery'}
                      </Text>
                    </View>
                  </>
                )}
                
                {selectedTx?.parcel && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.breakdownContainer}>
                      <Text style={styles.breakdownTitle}>Earnings Breakdown</Text>
                      
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Gross Amount</Text>
                        <Text style={styles.breakdownValue}>{formatLKR(selectedTx.parcel.price || 0)}</Text>
                      </View>

                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Service Fee</Text>
                        <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>
                          - {formatLKR(selectedTx.parcel.platformFee || 0)}
                        </Text>
                      </View>

                      <View style={styles.breakdownLine} />

                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabelTotal}>
                          {selectedTx.type === 'PLATFORM_FEE_DEDUCTION' ? 'Your Cash Profit' : 'Your Net Earning'}
                        </Text>
                        <Text style={styles.breakdownValueTotal}>
                          {formatLKR(
                            selectedTx.type === 'PLATFORM_FEE_DEDUCTION'
                              ? (selectedTx.parcel.price || 0) - (selectedTx.parcel.platformFee || 0)
                              : (selectedTx.amount || 0)
                          )}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {selectedTx?.parcelId && !selectedTx.parcel && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Related Parcel ID</Text>
                      <Text style={styles.detailValueSmall}>{selectedTx.parcelId}</Text>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTx(null)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
      fontFamily: Typography.extraBold, 
      color: theme.text.primary 
    },
    // ── Date Range Pickers ──────────────────────────────────────────────────
    datePickerContainer: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
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
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    dateButtonLabel: {
      fontSize: 9,
      fontFamily: Typography.bold,
      color: theme.text.tertiary,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    dateButtonValue: {
      fontSize: 12,
      fontFamily: Typography.bold,
      color: theme.text.primary,
    },
    dateSeparator: {
      paddingHorizontal: 2,
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
      fontSize: 10,
      fontFamily: Typography.bold,
      color: theme.text.secondary,
    },
    presetChipTextActive: {
      color: '#FFFFFF',
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16 },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.card,
      borderRadius: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    txIconBg: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    txMain: { flex: 1 },
    txDesc: { 
      fontSize: 14, 
      fontFamily: Typography.bold, 
      color: theme.text.primary,
      marginBottom: 2
    },
    txDate: { 
      fontSize: 12, 
      color: theme.text.tertiary, 
      fontFamily: Typography.medium 
    },
    pendingText: {
      fontSize: 11,
      color: '#EAB308',
      fontFamily: Typography.bold,
      marginTop: 2
    },
    txRight: { alignItems: 'flex-end' },
    txAmount: { 
      fontSize: 15, 
      fontFamily: Typography.bold,
      marginBottom: 2
    },
    txCurrency: { 
      fontSize: 10, 
      fontFamily: Typography.bold, 
      color: theme.text.tertiary 
    },
    emptyState: { 
      alignItems: 'center', 
      paddingVertical: 50,
      paddingHorizontal: 30,
      backgroundColor: theme.card,
      borderRadius: 32,
      marginTop: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyIconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyText: { 
      fontSize: 18, 
      fontFamily: Typography.bold, 
      color: theme.text.primary,
      marginBottom: 8
    },
    emptySubText: { 
      fontSize: 14, 
      color: theme.text.tertiary, 
      fontFamily: Typography.medium,
      textAlign: 'center',
      lineHeight: 20,
    },
    // Modal Styles
    modalOverlay: { 
      flex: 1, 
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end' 
    },
    modalBackground: {
      ...StyleSheet.absoluteFillObject,
    },
    detailSheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.border,
      maxHeight: '85%',
    },
    modalIndicator: {
      width: 40,
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 24,
    },
    detailHeader: { alignItems: 'center', marginBottom: 32 },
    txIconBgLarge: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    detailType: { 
      fontSize: 14, 
      fontFamily: Typography.bold, 
      color: theme.text.secondary,
      marginBottom: 8,
      letterSpacing: 1,
      textTransform: 'uppercase'
    },
    detailAmount: { 
      fontSize: 32, 
      fontFamily: Typography.extraBold,
      marginBottom: 16,
      letterSpacing: -1
    },
    detailStatusBadge: { 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderRadius: 100 
    },
    detailStatusText: { fontSize: 12, fontFamily: Typography.bold },
    detailBody: { 
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', 
      borderRadius: 24, 
      padding: 20,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: theme.border,
    },
    detailRow: { marginBottom: 4 },
    detailLabel: { 
      fontSize: 12, 
      fontFamily: Typography.medium, 
      color: theme.text.tertiary,
      marginBottom: 4 
    },
    detailValue: { 
      fontSize: 14, 
      fontFamily: Typography.bold, 
      color: theme.text.primary 
    },
    detailValueSmall: { 
      fontSize: 13, 
      fontFamily: Typography.medium, 
      color: theme.text.secondary 
    },
    detailDivider: { 
      height: 1, 
      backgroundColor: theme.border, 
      marginVertical: 16,
      borderStyle: 'dashed'
    },
    // Breakdown Styles
    breakdownContainer: {
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
    },
    breakdownTitle: {
      fontSize: 12,
      fontFamily: Typography.extraBold,
      color: theme.text.tertiary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    breakdownLabel: {
      fontSize: 13,
      fontFamily: Typography.medium,
      color: theme.text.secondary,
    },
    breakdownValue: {
      fontSize: 13,
      fontFamily: Typography.bold,
      color: theme.text.primary,
    },
    breakdownLine: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 10,
    },
    breakdownLabelTotal: {
      fontSize: 14,
      fontFamily: Typography.extraBold,
      color: theme.text.primary,
    },
    breakdownValueTotal: {
      fontSize: 16,
      fontFamily: Typography.extraBold,
      color: theme.primary,
    },
    closeBtn: {
      backgroundColor: theme.isDark ? '#006C52' : '#F1F5F9',
      paddingVertical: 16,
      borderRadius: 100,
      alignItems: 'center',
    },
    closeBtnText: {
      fontSize: 16,
      fontFamily: Typography.bold,
      color: theme.text.primary,
    },
  });
}
