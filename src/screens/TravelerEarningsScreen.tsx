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
import Svg, { Path } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as walletService from '../services/walletService';
import { WalletSummary, WalletTransaction } from '../services/walletService';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const BRAND_GREEN = '#00875A';
const BRAND_LIGHT = '#E6F5EF';

const formatLKR = (amount: number) =>
  `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TravelerEarningsScreen = () => {
  const { token } = useAuthStore();

  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryData, txData] = await Promise.all([
        walletService.getWalletSummary(token!),
        walletService.getTransactionHistory(token!),
      ]);
      setSummary(summaryData);
      setTransactions(txData);
    } catch (error) {
      console.error('Wallet fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
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
    if (!bankName || !accountNumber || !accountHolderName) {
      Toast.show({ type: 'error', text1: 'Please fill all bank details' });
      return;
    }

    setIsWithdrawing(true);
    try {
      const result = await walletService.requestWithdrawal(token!, {
        amount,
        bankName,
        accountNumber,
        accountHolderName,
      });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountHolderName('');
      Toast.show({ type: 'success', text1: 'Withdrawal Requested', text2: result.message });
      fetchData(); // Refresh balance
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: error?.message || 'Could not process withdrawal' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={BRAND_GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[BRAND_GREEN, '#005E3F']} style={styles.greenHeader} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={[BRAND_GREEN]} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Earnings</Text>
            <Text style={styles.headerSubtitle}>Your DropMate wallet</Text>
          </View>

          {/* Main Balance */}
          <View style={styles.mainBalanceContainer}>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <Text style={styles.balanceAmount}>{formatLKR(summary?.walletBalance || 0)}</Text>
            <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWithdrawModal(true)}>
              <Text style={styles.withdrawText}>Withdraw to Bank</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard label="This Month" value={formatLKR(summary?.thisMonthEarned || 0)} color="#FFFFFF" />
            <StatCard label="Total Earned" value={formatLKR(summary?.totalEarned || 0)} color="#A7F3D0" />
          </View>

          {/* Transaction History */}
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions yet.</Text>
                <Text style={styles.emptySubText}>Complete a delivery to start earning!</Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))
            )}

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Withdrawal Modal */}
      <Modal visible={showWithdrawModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Withdraw Funds</Text>
            <Text style={styles.modalSubtitle}>Available: {formatLKR(summary?.walletBalance || 0)}</Text>

            <Text style={styles.inputLabel}>Amount (LKR)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2000"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Bank Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Commercial Bank"
              value={bankName}
              onChangeText={setBankName}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 1234567890"
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Saman Perera"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.modalNote}>
              ⏱ Withdrawals are processed within 1–2 business days via bank transfer.
            </Text>

            <TouchableOpacity
              style={[styles.confirmBtn, isWithdrawing && { opacity: 0.6 }]}
              onPress={handleWithdraw}
              disabled={isWithdrawing}
            >
              {isWithdrawing
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmBtnText}>Request Withdrawal</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWithdrawModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const TransactionItem = ({ transaction }: { transaction: WalletTransaction }) => {
  const isCredit = transaction.type === 'DELIVERY_EARNED';
  return (
    <View style={styles.tranItem}>
      <View style={[styles.tranIconBox, { backgroundColor: isCredit ? BRAND_LIGHT : '#FEF2F2' }]}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={isCredit ? BRAND_GREEN : '#DC2626'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          {isCredit
            ? <Path d="M12 19V5M5 12l7-7 7 7" />
            : <Path d="M12 5v14M5 12l7 7 7-7" />}
        </Svg>
      </View>
      <View style={styles.tranContent}>
        <Text style={styles.tranTitle} numberOfLines={1}>
          {transaction.description || (isCredit ? 'Delivery Earned' : 'Withdrawal')}
        </Text>
        <Text style={styles.tranDate}>{formatDate(transaction.createdAt)}</Text>
        {transaction.status === 'PENDING' && (
          <Text style={styles.pendingBadge}>Processing</Text>
        )}
      </View>
      <Text style={[styles.tranAmount, { color: isCredit ? '#059669' : '#DC2626' }]}>
        {isCredit ? '+' : '-'}{formatLKR(transaction.amount)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  greenHeader: { paddingBottom: 220, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  safeArea: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  header: { paddingHorizontal: 24, paddingTop: 20, marginBottom: 24 },
  headerTitle: { fontSize: 28, color: '#FFFFFF', fontFamily: Typography.bold },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontFamily: Typography.regular },
  mainBalanceContainer: { alignItems: 'center', marginBottom: 28 },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: Typography.bold, letterSpacing: 1.5, textTransform: 'uppercase' },
  balanceAmount: { fontSize: 40, color: '#FFFFFF', marginVertical: 10, fontFamily: Typography.bold },
  withdrawBtn: { backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  withdrawText: { color: BRAND_GREEN, fontFamily: Typography.bold, fontSize: 15 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: Typography.bold, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontFamily: Typography.bold },
  historySection: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: Typography.bold, color: '#0F172A' },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontFamily: Typography.bold, color: '#64748B', marginBottom: 8 },
  emptySubText: { fontSize: 14, fontFamily: Typography.regular, color: '#94A3B8', textAlign: 'center' },
  tranItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tranIconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  tranContent: { flex: 1, marginRight: 8 },
  tranTitle: { fontSize: 14, fontFamily: Typography.bold, color: '#1E293B', marginBottom: 3 },
  tranDate: { fontSize: 12, color: '#94A3B8', fontFamily: Typography.regular },
  pendingBadge: { fontSize: 11, color: '#D97706', fontFamily: Typography.bold, marginTop: 2 },
  tranAmount: { fontSize: 14, fontFamily: Typography.bold },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontFamily: Typography.bold, color: '#0F172A', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, fontFamily: Typography.medium, color: '#64748B', marginBottom: 24 },
  inputLabel: { fontSize: 12, fontFamily: Typography.bold, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, fontFamily: Typography.medium, color: '#0F172A', marginBottom: 16 },
  modalNote: { fontSize: 13, color: '#64748B', fontFamily: Typography.regular, marginBottom: 24, lineHeight: 20 },
  confirmBtn: { backgroundColor: BRAND_GREEN, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  confirmBtnText: { color: '#FFFFFF', fontFamily: Typography.bold, fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: '#64748B', fontFamily: Typography.medium, fontSize: 15 },
});

export default TravelerEarningsScreen;
