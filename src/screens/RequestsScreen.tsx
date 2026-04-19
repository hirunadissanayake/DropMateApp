import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import * as deliveryService from '../services/deliveryService';
import Svg, { Path, Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import { Typography } from '../constants/Typography';

const RequestsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { token, user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = await deliveryService.getPendingMatches(token!);
      setRequests(data);
    } catch (error) {
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    const isIncoming = user?.id === item.travelerId;
    
    return (
      <TouchableOpacity 
        style={styles.requestCard}
        onPress={() => navigation.navigate('ParcelDetails', { parcelId: item.parcelId })}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <View style={[styles.roleBadge, { backgroundColor: isIncoming ? '#DCFBEB' : '#E0F2FE' }]}>
              <Text style={[styles.roleText, { color: isIncoming ? '#059669' : '#0284C7' }]}>
                {isIncoming ? 'Incoming Request' : 'Sent Request'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'PENDING' ? '#FEF3C7' : '#DCFBEB' }]}>
              <Text style={[styles.statusText, { color: item.status === 'PENDING' ? '#B45309' : '#059669' }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{dayjs(item.createdAt).format('MMM DD, HH:mm')}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.parcelInfo}>
            <Text style={styles.parcelName}>{item.parcel?.name}</Text>
            <View style={styles.routeRow}>
              <Text style={styles.routeText}>{item.parcel?.fromLocation} → {item.parcel?.toLocation}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.travelerSection}>
            <View style={styles.travelerAvatar}>
               <Text style={styles.avatarLetter}>
                 {isIncoming 
                   ? (item.sender?.name?.charAt(0) || 'C').toUpperCase() 
                   : (item.trip?.traveler?.name?.charAt(0) || 'T').toUpperCase()}
               </Text>
            </View>
            <View style={styles.travelerDetails}>
              <Text style={styles.travelerLabel}>{isIncoming ? 'From Customer' : 'To Traveler'}</Text>
              <Text style={styles.travelerName}>
                {isIncoming ? (item.sender?.name || 'Customer') : (item.trip?.traveler?.name || 'Traveler')}
              </Text>
            </View>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
              <Path d="M9 18l6-6-6-6" />
            </Svg>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Match Requests</Text>
          <Text style={styles.headerSubtitle}>Manage your delivery matches</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#006C52" />
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006C52']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5">
                    <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <Circle cx="8.5" cy="7" r="4" />
                    <Path d="M20 8v6M23 11h-6" />
                  </Svg>
                </View>
                <Text style={styles.emptyTitle}>No Requests Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your incoming and sent delivery requests will appear here.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
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
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    color: '#0F172A',
    fontFamily: Typography.bold,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Typography.regular,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontFamily: Typography.bold,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontFamily: Typography.bold,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Typography.regular,
  },
  cardBody: {
    gap: 16,
  },
  parcelInfo: {
    flex: 1,
  },
  parcelName: {
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 4,
    fontFamily: Typography.bold,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: Typography.regular,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  travelerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  travelerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    color: '#006C52',
    fontFamily: Typography.bold,
  },
  travelerDetails: {
    flex: 1,
  },
  travelerLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Typography.medium,
    marginBottom: 2,
  },
  travelerName: {
    fontSize: 15,
    color: '#1E293B',
    fontFamily: Typography.bold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#0F172A',
    fontFamily: Typography.bold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    fontFamily: Typography.regular,
  },
});

export default RequestsScreen;
