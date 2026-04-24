import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import * as authService from '../services/authService';
import { Typography } from '../constants/Typography';

const { width } = Dimensions.get('window');
const BRAND_GREEN = '#00875A';
const BRAND_LIGHT = '#E6F5EF';

const TravelerProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, token, logout, setUser, setAuth } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  const [editedName, setEditedName] = useState(user?.name || '');

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const userData = await authService.getMe(token);
      setUser(userData);
      setEditedName(userData.name);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleUpdateProfile = async () => {
    if (!token || !editedName.trim()) return;
    
    setLoading(true);
    try {
      await authService.updateProfile(token, {
        name: editedName,
      });
      await fetchProfile();
      setIsEditing(false);
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your name has been updated successfully.',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedName(user?.name || '');
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    Toast.show({
      type: 'success',
      text1: 'Signed Out',
      text2: 'You have been successfully logged out.'
    });
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleSwitchRole = async () => {
    if (!token) return;
    setSwitching(true);
    try {
      const response = await authService.switchRole(token, 'CUSTOMER');
      setAuth(response.token, response.user);
      Toast.show({
        type: 'success',
        text1: 'Role Switched',
        text2: 'You are now in Customer mode',
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerHome' }],
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Switch Failed',
        text2: error.message || 'Could not switch role',
      });
    } finally {
      setSwitching(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [token]);

  const getInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  };



  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#F0FDF4', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 18l-6-6 6-6" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[BRAND_GREEN]}
              tintColor={BRAND_GREEN}
            />
          }
        >
          
          {/* Profile Header Card */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarBorder}>
                <View style={styles.avatarContainer}>
                   {user?.selfieUrl ? (
                     <Image source={{ uri: user.selfieUrl }} style={styles.avatarRealImage} />
                   ) : (
                     <Text style={styles.avatarText}>{getInitial(user?.name || '')}</Text>
                   )}
                </View>
              </View>
            </View>
            
            <View style={styles.userMeta}>
              {isEditing ? (
                <View style={styles.nameEditWrapper}>
                  <TextInput
                    style={styles.nameInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Full Name"
                    autoFocus
                  />
                  <View style={styles.editActionsInline}>
                    <TouchableOpacity 
                      onPress={handleCancel}
                      disabled={loading}
                      style={[styles.miniActionBtn, { backgroundColor: '#F1F5F9' }]}
                    >
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="3">
                        <Path d="M18 6L6 18M6 6l12 12"/>
                      </Svg>
                    </TouchableOpacity>
                    {(editedName.trim() !== (user?.name || '')) && (
                      <TouchableOpacity 
                        onPress={handleUpdateProfile}
                        disabled={loading}
                        style={[styles.miniActionBtn, { backgroundColor: BRAND_GREEN }]}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3">
                            <Path d="M20 6L9 17l-5-5"/>
                          </Svg>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.nameRow}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.userName}>{user?.name || 'Traveler'}</Text>
                  <View style={styles.editBadgeSmall}>
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                      <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </Svg>
                  </View>
                </TouchableOpacity>
              )}
              
              <View style={styles.badgeRow}>
                <View style={[styles.statusBadge, { backgroundColor: user?.isTravelerApproved ? BRAND_LIGHT : '#FEE2E2' }]}>
                  <Text style={[styles.statusText, { color: user?.isTravelerApproved ? BRAND_GREEN : '#EF4444' }]}>
                    {user?.isTravelerApproved ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionHeaderTitle}>Account Overview</Text>

              <TouchableOpacity 
              style={styles.itemRow}
              onPress={() => navigation.navigate('PersonalDetails')}
            >
              <View style={styles.itemIconBox}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="1.5"><Circle cx="12" cy="7" r="4"/><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></Svg>
              </View>
              <View style={{ flex: 1 }}>
                  <Text style={styles.itemLabel}>Personal Details</Text>
                  <Text style={styles.itemSubLabel}>Identify, Documents & Status</Text>
              </View>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                  <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>
            
            {user?.isTravelerApproved && (
              <TouchableOpacity 
                style={styles.itemRow}
                onPress={() => navigation.navigate('TravelerEarnings')}
              >
                <View style={styles.itemIconBox}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="1.5">
                      <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <Path d="M1 10h22" />
                      <Path d="M12 14h6" />
                    </Svg>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>My Earnings</Text>
                    <Text style={styles.itemSubLabel}>Balance, History & Withdrawals</Text>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                    <Path d="M9 18l6-6-6-6" />
                </Svg>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.itemRow}
              onPress={() => navigation.navigate('BankDetails')}
            >
              <View style={styles.itemIconBox}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="1.5">
                    <Path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
                  </Svg>
              </View>
              <View style={{ flex: 1 }}>
                  <Text style={styles.itemLabel}>Bank Accounts</Text>
                  <Text style={styles.itemSubLabel}>Manage saved payout accounts</Text>
              </View>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                  <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>



            {(!user?.isCustomerRequested && !user?.isCustomerApproved) ? (
              <TouchableOpacity 
                style={styles.itemRow}
                onPress={() => navigation.navigate('RequestRole')}
              >
                <View style={styles.itemIconBox}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="1.5">
                        <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <Circle cx="8.5" cy="7" r="4" />
                        <Path d="M20 8v6M23 11h-6" />
                    </Svg>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>Become a Customer</Text>
                    <Text style={styles.itemSubLabel}>Unlock parcel shipping features</Text>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                    <Path d="M9 18l6-6-6-6" />
                </Svg>
              </TouchableOpacity>
            ) : (user?.isCustomerRequested && !user?.isCustomerApproved) ? (
              <View style={[styles.itemRow, { opacity: 0.7 }]}>
                <View style={styles.itemIconBox}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
                        <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </Svg>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>Customer Request Pending</Text>
                    <Text style={styles.itemSubLabel}>Verification in progress</Text>
                </View>
              </View>
            ) : null}

            {user?.isCustomerApproved && (
              <TouchableOpacity
                style={styles.switchRoleBtn}
                onPress={handleSwitchRole}
                disabled={switching}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#006C52', '#004A38']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.switchRoleContent}>
                  <View style={styles.switchIconBox}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                      <Path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                    </Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchRoleTitle}>Switch to Customer</Text>
                    <Text style={styles.switchRoleSub}>Send parcels with verified travelers</Text>
                  </View>
                  {switching ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                      <Path d="M9 18l6-6-6-6" />
                    </Svg>
                  )}
                </View>
              </TouchableOpacity>
            )}


            <Text style={[styles.sectionHeaderTitle, { marginTop: 32 }]}>General</Text>
            <SettingsItem 
              icon="bell" 
              label="Notifications" 
              onPress={() => navigation.navigate('Notifications')}
            />
            <SettingsItem 
              icon="lock" 
              label="Account Security" 
              onPress={() => navigation.navigate('ChangePassword')}
            />
            
            <TouchableOpacity 
              style={styles.logoutBtn}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Sign Out Account</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const SettingsItem = ({ icon, label, onPress }: any) => (
    <TouchableOpacity style={styles.itemRow} onPress={onPress}>
      <View style={styles.itemIconBox}>
        {renderIcon(icon)}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    </TouchableOpacity>
);

const renderIcon = (name: string) => {
    const size = 20;
    const color = BRAND_GREEN;
    if (name === 'bell') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>;
    if (name === 'lock') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>;
    return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: '#0F172A',
    fontFamily: Typography.extraBold,
  },
  scrollContent: {
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 2,
    borderWidth: 2,
    borderColor: BRAND_GREEN,
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarRealImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontFamily: Typography.bold,
  },
  userMeta: {
    alignItems: 'center',
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingLeft: 22,
  },
  userName: {
    fontSize: 22,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  editBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameEditWrapper: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  nameInput: {
    flex: 1,
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND_GREEN,
    paddingVertical: 8,
    fontFamily: Typography.bold,
  },
  editActionsInline: {
    flexDirection: 'row',
    gap: 6,
  },
  miniActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontFamily: Typography.bold,
  },
  settingsSection: {
    paddingHorizontal: 20,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontFamily: Typography.bold,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemIconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 15,
    fontFamily: Typography.bold,
    color: '#1E293B',
  },
  itemSubLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,

  },
  logoutBtn: {
    backgroundColor: '#FFF1F2',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    color: '#E11D48',
    fontFamily: Typography.bold,
    fontSize: 16,
  },
  switchRoleBtn: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  switchRoleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  switchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRoleTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Typography.bold,
  },
  switchRoleSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontFamily: Typography.regular,
  },
});

export default TravelerProfileScreen;
