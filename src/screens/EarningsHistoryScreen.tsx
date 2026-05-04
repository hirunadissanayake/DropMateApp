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

const formatLKR = (amount: number) =>
  `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function EarningsHistoryScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation();
  const { token } = useAuthStore();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);

  const fetchTransactions = async () => {
    try {
      const txData = await walletService.getTransactionHistory(token!);
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
  }, [token]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
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
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedTx(null)}
        >
          <View style={styles.detailSheet}>
            <View style={styles.modalIndicator} />
            
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
                {selectedTx?.type === 'DELIVERY_EARNED' ? 'Delivery Earnings' : 'Withdrawal Payout'}
              </Text>
              <Text style={[styles.detailAmount, { 
                 color: selectedTx?.type === 'DELIVERY_EARNED' ? (theme.isDark ? '#3DD9A4' : theme.primary) : theme.text.primary
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
      fontSize: 18, 
      fontFamily: Typography.bold, 
      color: theme.text.primary 
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
    detailSheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.border,
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
