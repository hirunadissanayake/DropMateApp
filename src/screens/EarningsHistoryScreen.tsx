import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Animated,
  PanResponder,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function EarningsHistoryScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation();
  const { token } = useAuthStore();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Date filter state
  const [startDate, setStartDate] = useState<Date>(dayjs().subtract(1, 'month').toDate());
  const [endDate, setEndDate] = useState<Date>(dayjs().toDate());
  const [activePreset, setActivePreset] = useState<FilterPeriod>('Last 30 Days');
  
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);

  // Swipe to close logic
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger if swiping down and not scrolling up
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Close modal
          setSelectedTx(null);
        } else {
          // Reset position
          Animated.spring(panY, {
            toValue: 0,
            damping: 20,
            stiffness: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (selectedTx) {
      panY.setValue(0);
    }
  }, [selectedTx]);

  const fetchTransactions = async (pageNum = 1) => {
    if (!token) return;
    if (pageNum === 1 && !refreshing) setLoading(true);
    
    try {
      const filters = activePreset === 'Total' ? {} : {
        startDate: dayjs(startDate).format('YYYY-MM-DD'),
        endDate: dayjs(endDate).format('YYYY-MM-DD'),
      };
      
      const data = await walletService.getTransactionHistory(token, { ...filters, page: pageNum, limit: 12 });
      
      if (pageNum === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Wallet tx fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setPage(1);
    setHasMore(true);
    fetchTransactions(1);
  }, [token, startDate, endDate, activePreset]));

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchTransactions(1);
  };

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchTransactions(page + 1);
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

        {/* Date Range Pickers*/}
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

              <View style={{ height: 16 }} />

              <View style={styles.dateButtonGrid}>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => setStartDatePickerVisibility(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateIconBox}>
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><Path d="M16 2v4M8 2v4M3 10h18"/>
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
                      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><Path d="M16 2v4M8 2v4M3 10h18"/>
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

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={theme.isDark ? theme.primary : "#94A3B8"} 
            />
          }
          renderItem={({ item: tx }) => (
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
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.isDark ? theme.primary : "#FFFFFF"} strokeWidth="1.5">
                    <Circle cx="12" cy="12" r="10" /><Path d="M12 8v8M8 12h8" />
                  </Svg>
                </View>
                <Text style={styles.emptyText}>No earnings yet</Text>
                <Text style={styles.emptySubText}>Completed deliveries will show up here</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : !hasMore && transactions.length > 0 ? (
              <Text style={styles.endText}>No more transactions</Text>
            ) : <View style={{ height: 40 }} />
          }
        />
        )}
      </SafeAreaView>

      {/* Transaction Detail Modal */}
      <Modal visible={!!selectedTx} animationType="slide" transparent onRequestClose={() => setSelectedTx(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackground} onPress={() => setSelectedTx(null)} />
          
          <Animated.View 
            style={[
              styles.detailSheet,
              { transform: [{ translateY: panY }] }
            ]}
            {...panResponder.panHandlers}
          >
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
          </Animated.View>
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
    //Date Range Pickers 
    datePickerContainer: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
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
    endText: {
      textAlign: 'center',
      paddingVertical: 20,
      color: theme.text.tertiary,
      fontFamily: Typography.medium,
      fontSize: 13,
    },
  });
}
