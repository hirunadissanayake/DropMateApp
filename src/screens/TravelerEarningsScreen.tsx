import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const BRAND_GREEN = '#00875A';
const BRAND_LIGHT = '#E6F5EF';

const TravelerEarningsScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[BRAND_GREEN, '#005E3F']}
        style={styles.greenHeader}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSubtitle}>Manage your revenue</Text>
        </View>

        <View style={styles.mainBalanceContainer}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>$2,450.80</Text>
          
          <TouchableOpacity style={styles.withdrawBtn}>
            <Text style={styles.withdrawText}>Withdraw Funds</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Pending" value="$320.00" color="#FACC15" />
          <StatCard label="This Month" value="$850.00" color="#FFFFFF" />
        </View>

        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <TransactionItem 
              title="Dubai to London delivery" 
              amount="+$120.00" 
              date="Just now" 
              type="delivery"
            />
            <TransactionItem 
              title="Withdrawal to Bank" 
              amount="-$500.00" 
              date="2 days ago" 
              type="withdraw"
            />
            <TransactionItem 
              title="Berlin to Paris trip" 
              amount="+$65.00" 
              date="4 Apr, 2026" 
              type="delivery"
            />
            <TransactionItem 
              title="Bonus Referral" 
              amount="+$25.00" 
              date="1 Apr, 2026" 
              type="referral"
            />
            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
};

const StatCard = ({ label, value, color }: any) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const TransactionItem = ({ title, amount, date, type }: any) => {
  const isPositive = amount.startsWith('+');
  
  return (
    <View style={styles.tranItem}>
      <View style={styles.tranIconBox}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {type === 'withdraw' ? <Path d="M12 5v14M5 12l7 7 7-7" /> : <Path d="M12 19V5M5 12l7-7 7 7" />}
        </Svg>
      </View>
      <View style={styles.tranContent}>
        <Text style={styles.tranTitle}>{title}</Text>
        <Text style={styles.tranDate}>{date}</Text>
      </View>
      <Text style={[styles.tranAmount, { color: isPositive ? '#059669' : '#0F172A' }]}>
        {amount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  greenHeader: {
    paddingBottom: 220,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  safeArea: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  mainBalanceContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 12,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-ExtraBold',
  },
  withdrawBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  withdrawText: {
    color: BRAND_GREEN,
    fontWeight: '800',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  historySection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllText: {
    color: BRAND_GREEN,
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  tranItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tranIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: BRAND_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tranContent: {
    flex: 1,
  },
  tranTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  tranDate: {
    fontSize: 13,
    color: '#94A3B8',
  },
  tranAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default TravelerEarningsScreen;
