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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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

const BRAND_GREEN = '#00875A';
const BRAND_DARK = '#004D3A';
const BRAND_LIGHT = '#E6F5EF';

const formatLKR = (amount: number) =>
  `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TravelerEarningsScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuthStore();

  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // Transaction detail modal state
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  
  // Saved bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankDetail[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [summaryData, txData, bankData] = await Promise.all([
        walletService.getWalletSummary(token!),
        walletService.getTransactionHistory(token!),
        bankService.getBankDetails(token!),
      ]);
      setSummary(summaryData);
      setTransactions(txData);
      setBankAccounts(bankData);

      // Auto-select default or first bank
      if (bankData.length > 0 && !selectedBankId) {
        const defaultBank = bankData.find(b => b.isDefault) || bankData[0];
        setSelectedBankId(defaultBank.id);
      }
    } catch (error) {
      console.error('Wallet/Bank fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
  }, [token]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid amount' });
      return;
    }

    if (!selectedBankId) {
      Toast.show({ type: 'error', text1: 'Please select a payout method' });
      return;
    }

    setIsWithdrawing(true);
    try {
      const payload: any = { 
        amount,
        bankDetailId: selectedBankId
      };

      const result = await walletService.requestWithdrawal(token!, payload);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      Toast.show({ type: 'success', text1: 'Withdrawal Requested', text2: result.message });
      fetchData(); // Refresh balance
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: error?.message || 'Could not process withdrawal' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={[BRAND_GREEN]} />}
      >
        <LinearGradient colors={[BRAND_GREEN, BRAND_DARK]} style={styles.heroSection}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
               <BackButton color="#FFFFFF" onPress={() => navigation.goBack()} />
               <Text style={styles.headerTitle}>My Earnings</Text>
               <View style={{ width: 40 }} />
            </View>

            <View style={styles.balanceContainer}>
               <Text style={styles.balanceLabel}>Available for Payout</Text>
               <Text style={styles.balanceAmount}>{formatLKR(summary?.walletBalance || 0)}</Text>
               
               <TouchableOpacity 
                  style={styles.withdrawMainBtn} 
                  onPress={() => setShowWithdrawModal(true)}
                  activeOpacity={0.8}
               >
                  <Text style={styles.withdrawMainText}>Request Payout</Text>
               </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.contentBody}>
          {/* Dashboard Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
               <Text style={styles.statLabel}>This Month</Text>
               <Text style={styles.statValue}>{formatLKR(summary?.thisMonthEarned || 0)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
               <Text style={styles.statLabel}>Lifetime Earned</Text>
               <Text style={styles.statValue}>{formatLKR(summary?.totalEarned || 0)}</Text>
            </View>
          </View>

          {/* Activity Section */}
          <View style={styles.activityHeader}>
             <Text style={styles.activityTitle}>Earnings History</Text>
          </View>

          <View style={styles.transactionsList}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                   <Circle cx="12" cy="12" r="10" /><Path d="M12 8v8M8 12h8" />
                </Svg>
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
                    backgroundColor: tx.type === 'DELIVERY_EARNED' ? '#ECFDF5' : '#FFF1F2' 
                  }]}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                      stroke={tx.type === 'DELIVERY_EARNED' ? BRAND_GREEN : '#E11D48'} strokeWidth="2.5">
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
                      color: tx.type === 'DELIVERY_EARNED' ? '#059669' : '#0F172A' 
                    }]}>
                      {tx.type === 'DELIVERY_EARNED' ? '+' : '-'}{formatLKR(tx.amount).replace('LKR ', '')}
                    </Text>
                    <Text style={styles.txCurrency}>LKR</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Withdrawal Modal */}
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
                  placeholderTextColor="#94A3B8"
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
                        style={[
                          styles.bankSelectOption,
                          selectedBankId === bank.id && styles.bankSelectOptionActive
                        ]}
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
                 <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
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
 
      {/* Transaction Detail Modal */}
      <Modal visible={!!selectedTx} animationType="fade" transparent onRequestClose={() => setSelectedTx(null)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedTx(null)}
        >
          <View style={styles.detailSheet}>
            <View style={styles.modalIndicator} />
            
            <View style={styles.detailHeader}>
              <View style={[styles.txIconBgLarge, { 
                backgroundColor: selectedTx?.type === 'DELIVERY_EARNED' ? '#ECFDF5' : '#FFF1F2' 
              }]}>
                <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" 
                  stroke={selectedTx?.type === 'DELIVERY_EARNED' ? BRAND_GREEN : '#E11D48'} strokeWidth="2.5">
                  {selectedTx?.type === 'DELIVERY_EARNED' ? <Path d="M12 19V5M5 12l7-7 7 7" /> : <Path d="M12 5v14M5 12l7 7 7-7" />}
                </Svg>
              </View>
              <Text style={styles.detailType}>
                {selectedTx?.type === 'DELIVERY_EARNED' ? 'Delivery Earnings' : 'Withdrawal Payout'}
              </Text>
              <Text style={[styles.detailAmount, { 
                color: selectedTx?.type === 'DELIVERY_EARNED' ? BRAND_GREEN : '#0F172A' 
              }]}>
                {selectedTx?.type === 'DELIVERY_EARNED' ? '+' : '-'}{formatLKR(selectedTx?.amount || 0)}
              </Text>
              
              <View style={[styles.detailStatusBadge, { 
                backgroundColor: selectedTx?.status === 'COMPLETED' ? '#DCFCE7' : selectedTx?.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2' 
              }]}>
                <Text style={[styles.detailStatusText, { 
                  color: selectedTx?.status === 'COMPLETED' ? '#166534' : selectedTx?.status === 'PENDING' ? '#92400E' : '#991B1B' 
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
              
              {selectedTx?.parcelId && (
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
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  heroSection: { 
    paddingBottom: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: { 
    fontSize: 28, 
    fontFamily: Typography.bold, 
    color: '#FFFFFF' 
  },
  balanceContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  balanceLabel: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.7)', 
    fontFamily: Typography.medium,
    marginBottom: 8
  },
  balanceAmount: { 
    fontSize: 36, 
    color: '#FFFFFF', 
    fontFamily: Typography.bold,
    marginBottom: 24,
    letterSpacing: -1
  },
  withdrawMainBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  withdrawMainText: { 
    color: BRAND_GREEN, 
    fontFamily: Typography.bold, 
    fontSize: 15 
  },
  contentBody: {
    paddingHorizontal: 24,
    marginTop: -20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 32,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: '100%', backgroundColor: '#F1F5F9' },
  statLabel: { 
    fontSize: 11, 
    color: '#94A3B8', 
    fontFamily: Typography.bold, 
    textTransform: 'uppercase',
    marginBottom: 6
  },
  statValue: { 
    fontSize: 15, 
    color: '#1E293B', 
    fontFamily: Typography.bold 
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: { 
    fontSize: 18, 
    fontFamily: Typography.bold, 
    color: '#0F172A' 
  },
  transactionsList: { flex: 1 },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
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
    color: '#1E293B',
    marginBottom: 2
  },
  txDate: { 
    fontSize: 12, 
    color: '#94A3B8', 
    fontFamily: Typography.medium 
  },
  pendingText: {
    fontSize: 11,
    color: '#D97706',
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
    color: '#CBD5E1' 
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 60,
    backgroundColor: '#F8FAFC',
    borderRadius: 32,
    marginTop: 10
  },
  emptyText: { 
    fontSize: 16, 
    fontFamily: Typography.bold, 
    color: '#475569',
    marginTop: 16,
    marginBottom: 4
  },
  emptySubText: { 
    fontSize: 13, 
    color: '#94A3B8', 
    fontFamily: Typography.medium 
  },
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end' 
  },
  modalSheet: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 32,
    maxHeight: '85%'
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20
  },
  modalHeader: { marginBottom: 24 },
  modalTitle: { 
    fontSize: 22, 
    fontFamily: Typography.bold, 
    color: '#0F172A',
    marginBottom: 4
  },
  modalSubtitle: { 
    fontSize: 14, 
    fontFamily: Typography.medium, 
    color: '#64748B' 
  },
  inputGroup: { marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { 
    fontSize: 13, 
    fontFamily: Typography.bold, 
    color: '#475569', 
    marginBottom: 8 
  },
  modalInput: { 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    borderRadius: 16, 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    fontSize: 15, 
    fontFamily: Typography.medium,
    color: '#0F172A'
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 6, marginLeft: 4, fontFamily: Typography.medium },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10
  },
  infoNoticeText: { 
    flex: 1, 
    fontSize: 12, 
    color: '#475569', 
    fontFamily: Typography.medium,
    lineHeight: 18
  },
  confirmBtn: { 
    backgroundColor: BRAND_GREEN, 
    borderRadius: 18, 
    paddingVertical: 18, 
    alignItems: 'center',
    marginBottom: 12
  },
  confirmBtnText: { 
    color: '#FFFFFF', 
    fontFamily: Typography.bold, 
    fontSize: 16 
  },
  cancelBtn: { 
    alignItems: 'center', 
    paddingVertical: 12 
  },
  cancelBtnText: { 
    color: '#94A3B8', 
    fontFamily: Typography.bold, 
    fontSize: 15 
  },
  bankHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  manageBanksText: {
    fontSize: 12,
    color: BRAND_GREEN,
    fontFamily: Typography.bold,
  },
  bankSelector: {
    gap: 10
  },
  bankSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 14,
  },
  bankSelectOptionActive: {
    borderColor: BRAND_GREEN,
    backgroundColor: '#F0FDF4',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  radioCircleActive: {
    borderColor: BRAND_GREEN
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_GREEN
  },
  bankSelectInfo: {
    flex: 1
  },
  bankSelectName: {
    fontSize: 14,
    fontFamily: Typography.bold,
    color: '#1E293B'
  },
  bankSelectAcc: {
    fontSize: 12,
    fontFamily: Typography.medium,
    color: '#64748B'
  },
  noBanksBtn: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center'
  },
  noBanksText: {
    fontSize: 14,
    fontFamily: Typography.bold,
    color: BRAND_GREEN
  },
  detailSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 32,
    width: '100%',
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  txIconBgLarge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailType: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailAmount: {
    fontSize: 32,
    fontFamily: Typography.bold,
    color: '#0F172A',
    marginBottom: 12,
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailStatusText: {
    fontSize: 12,
    fontFamily: Typography.bold,
    textTransform: 'uppercase',
  },
  detailBody: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
  },
  detailRow: {
    marginBottom: 0,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1E293B',
    fontFamily: Typography.bold,
  },
  detailValueSmall: {
    fontSize: 12,
    color: '#475569',
    fontFamily: Typography.medium,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#475569',
    fontFamily: Typography.bold,
    fontSize: 16,
  },
});

export default TravelerEarningsScreen;
