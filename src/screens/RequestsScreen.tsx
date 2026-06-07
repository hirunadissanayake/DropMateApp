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
  Alert,
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
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const RequestsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { token, user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = makeStyles(theme);

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

  const handleCancelRequest = (matchId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to withdraw this delivery request? You can send a new request after cancelling.',
      [
        { text: 'No, Keep it', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await deliveryService.cancelMatch(token!, matchId);
              fetchRequests();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Could not cancel request. Please try again.');
            }
          }
        }
      ]
    );
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
            <View style={[styles.roleBadge, { backgroundColor: isIncoming ? (theme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFBEB') : (theme.isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE') }]}>
              <Text style={[styles.roleText, { color: isIncoming ? '#10B981' : '#0EA5E9' }]}>
                {isIncoming ? 'Incoming Request' : 'Sent Request'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'PENDING' ? (theme.isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7') : (theme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFBEB') }]}>
              <Text style={[styles.statusText, { color: item.status === 'PENDING' ? '#F59E0B' : '#10B981' }]}>
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
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2.5">
              <Path d="M9 18l6-6-6-6" />
            </Svg>
          </View>

          {/* Cancel button — only for Sent Requests that are still PENDING */}
          {!isIncoming && item.status === 'PENDING' && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelRequest(item.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Match Requests</Text>
          <Text style={styles.headerSubtitle}>Manage your delivery matches</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5">
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

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    color: theme.text.primary,
    fontFamily: Typography.bold,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.text.secondary,
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
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDark ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text.tertiary,
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
    color: theme.text.primary,
    marginBottom: 4,
    fontFamily: Typography.bold,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    color: theme.text.secondary,
    fontFamily: Typography.regular,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
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
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    color: theme.primary,
    fontFamily: Typography.bold,
  },
  travelerDetails: {
    flex: 1,
  },
  travelerLabel: {
    fontSize: 11,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
    marginBottom: 2,
  },
  travelerName: {
    fontSize: 15,
    color: theme.text.primary,
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
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    fontFamily: Typography.regular,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: Typography.bold,
    color: '#EF4444',
  },
});

export default RequestsScreen;
