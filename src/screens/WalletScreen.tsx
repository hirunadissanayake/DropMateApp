import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as walletService from '../services/walletService';
import { WalletTransaction } from '../services/walletService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/common/BackButton';
import { useTheme } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';

const BRAND_GREEN = '#00875A';

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

const WalletScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { token, user } = useAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchTransactions = async () => {
    if (!loading) setIsFetching(true);
    try {
      const data = await walletService.getTransactionHistory(token!);
      // Fix: Account for paginated response structure
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Wallet transactions fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsFetching(false);
    }
  };

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    fetchTransactions();
  }, [token]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const formatLKR = (amount: number) =>
    `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-LK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isFocused = useIsFocused();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isFocused && <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />}
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton color={theme.text.primary} onPress={() => navigation.goBack()} />
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>My Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_GREEN} colors={[BRAND_GREEN]} />
          }
        >
          {loading && !refreshing ? (
            <>
               {/* Skeleton Balance Card */}
               <View style={[styles.balanceCard, { backgroundColor: theme.isDark ? theme.card : '#F8FAFC', shadowColor: 'transparent', elevation: 0, borderWidth: 1, borderColor: theme.border }]}>
                 <View style={styles.balanceHeader}>
                   <SkeletonItem style={{ width: 100, height: 16 }} />
                   <SkeletonItem style={{ width: 24, height: 24, borderRadius: 12 }} />
                 </View>
                 <SkeletonItem style={{ width: 220, height: 44, marginBottom: 16 }} />
                 <SkeletonItem style={{ width: 160, height: 14 }} />
               </View>

               {/* Skeleton Actions */}
               <View style={styles.quickActions}>
                 {[1, 2, 3].map(i => (
                   <View key={i} style={styles.actionBtn}>
                     <SkeletonItem style={{ width: 54, height: 54, borderRadius: 27, marginBottom: 10 }} />
                     <SkeletonItem style={{ width: 60, height: 12 }} />
                   </View>
                 ))}
               </View>

               {/* Skeleton History Header */}
               <View style={styles.historyContainer}>
                 <SkeletonItem style={{ width: 150, height: 20, marginBottom: 20 }} />
                 {[1, 2, 3, 4, 5].map(i => (
                   <View key={i} style={[styles.txItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                     <SkeletonItem style={{ width: 40, height: 40, borderRadius: 12, marginRight: 12 }} />
                     <View style={styles.txInfo}>
                       <SkeletonItem style={{ width: 140, height: 14, marginBottom: 6 }} />
                       <SkeletonItem style={{ width: 100, height: 12 }} />
                     </View>
                     <SkeletonItem style={{ width: 80, height: 20 }} />
                   </View>
                 ))}
               </View>
            </>
          ) : (
            <>
              {/* Balance Card */}
              <LinearGradient
                colors={[BRAND_GREEN, '#004D3A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
              >
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceLabel}>Current Balance</Text>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                    <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <Path d="M1 10h22" />
                  </Svg>
                </View>
                {isFetching ? (
                  <SkeletonItem style={{ width: 200, height: 44, borderRadius: 8, marginBottom: 8 }} />
                ) : (
                  <Text style={styles.balanceValue}>{formatLKR(user?.walletBalance || 0)}</Text>
                )}
                <Text style={styles.balanceNote}>Credits available for shipping</Text>
              </LinearGradient>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.isDark ? 'rgba(37,99,235,0.1)' : '#DBEAFE' }]}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                        <Path d="M12 5v14M5 12l7 7 7-7" />
                    </Svg>
                  </View>
                  <Text style={[styles.actionLabel, { color: theme.text.secondary }]}>Top Up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.isDark ? 'rgba(0,135,90,0.1)' : '#F0FDF4' }]}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="2.5">
                        <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </Svg>
                  </View>
                  <Text style={[styles.actionLabel, { color: theme.text.secondary }]}>Withdraw</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2' }]}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                        <Circle cx="12" cy="12" r="10" /><Path d="M12 8v4M12 16h.01" />
                    </Svg>
                  </View>
                  <Text style={[styles.actionLabel, { color: theme.text.secondary }]}>Help</Text>
                </TouchableOpacity>
              </View>

              {/* Transaction List */}
              <View style={styles.historyContainer}>
                <Text style={[styles.historyTitle, { color: theme.text.primary }]}>Payment History</Text>
                
                {transactions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                      <Path d="M12 2v20M2 12h20" />
                    </Svg>
                    <Text style={styles.emptyText}>No transactions yet</Text>
                  </View>
                ) : (
                  transactions.map((tx) => (
                    <View key={tx.id} style={[styles.txItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={[styles.txIcon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
                        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                          stroke={tx.type === 'DELIVERY_EARNED' ? BRAND_GREEN : '#DC2626'} strokeWidth="2.5">
                          {tx.type === 'DELIVERY_EARNED' ? <Path d="M12 19V5M5 12l7-7 7 7" /> : <Path d="M12 5v14M5 12l7 7 7-7" />}
                        </Svg>
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={[styles.txTitle, { color: theme.text.primary }]} numberOfLines={1}>{tx.description || 'Transaction'}</Text>
                        <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                      </View>
                      <Text style={[styles.txAmount, { color: tx.type === 'DELIVERY_EARNED' ? (theme.isDark ? '#10b981' : '#059669') : theme.text.primary }]}>
                        {tx.type === 'DELIVERY_EARNED' ? '+' : '-'}{formatLKR(tx.amount)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 20, fontFamily: Typography.bold },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: Typography.medium },
  balanceValue: { color: '#FFFFFF', fontSize: 32, fontFamily: Typography.bold, marginBottom: 8 },
  balanceNote: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: Typography.regular },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 40 },
  actionBtn: { alignItems: 'center', flex: 1 },
  iconCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 13, fontFamily: Typography.medium },
  historyContainer: { flex: 1 },
  historyTitle: { fontSize: 18, fontFamily: Typography.bold, marginBottom: 20 },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontFamily: Typography.bold, marginBottom: 4 },
  txDate: { fontSize: 12, color: '#94A3B8', fontFamily: Typography.regular },
  txAmount: { fontSize: 14, fontFamily: Typography.bold },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 15, fontSize: 15, color: '#94A3B8', fontFamily: Typography.medium },
});

export default WalletScreen;
