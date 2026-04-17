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

const TravelerServicesScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F0FDF4', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Available Services</Text>
          <Text style={styles.headerSubtitle}>Discover new delivery routes</Text>
        </View>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity style={[styles.filterBtn, styles.activeFilter]}>
              <Text style={styles.activeFilterText}>All Routes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterText}>High Payout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterText}>International</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterText}>Inter-City</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <ServiceCard 
            from="Dubai, UAE" 
            to="London, UK" 
            payout="$120.00" 
            date="22 Apr, 2026"
            urgency="High"
          />
          <ServiceCard 
            from="New York, USA" 
            to="Toronto, CAN" 
            payout="$45.00" 
            date="25 Apr, 2026"
            urgency="Medium"
          />
          <ServiceCard 
            from="Berlin, GER" 
            to="Paris, FRA" 
            payout="$65.00" 
            date="28 Apr, 2026"
            urgency="Normal"
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const ServiceCard = ({ from, to, payout, date, urgency }: any) => {
  const urgencyColor = urgency === 'High' ? '#DC2626' : urgency === 'Medium' ? '#D97706' : '#059669';
  
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={styles.routeRow}>
          <View style={styles.dotColumn}>
            <View style={styles.dot} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: BRAND_GREEN }]} />
          </View>
          <View style={styles.locationColumn}>
            <Text style={styles.locationText}>{from}</Text>
            <Text style={styles.locationText}>{to}</Text>
          </View>
        </View>
        <View style={styles.payoutBadge}>
          <Text style={styles.payoutText}>{payout}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <>
              <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <Path d="M16 2v4M8 2v4M3 10h18"/>
            </>
          </Svg>
          <Text style={styles.footerText}>{date}</Text>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '10' }]}>
          <Text style={[styles.urgencyText, { color: urgencyColor }]}>{urgency}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Medium',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilter: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  routeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dotColumn: {
    alignItems: 'center',
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  locationColumn: {
    gap: 16,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  payoutBadge: {
    backgroundColor: BRAND_LIGHT,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  payoutText: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND_GREEN,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  urgencyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default TravelerServicesScreen;
