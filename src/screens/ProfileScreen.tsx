import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  ScrollView,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import * as authService from '../services/authService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../constants/Typography';
import BackButton from '../components/common/BackButton';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';
import { useNotificationStore } from '../store/notificationStore';
import CustomAlert from '../components/common/CustomAlert';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { user, token, logout, setUser, setAuth } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const s = makeStyles(theme);
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const userData = await authService.getMe(token);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    if (token) fetchUnreadCount(token);
  }, []);


  const handleLogout = () => {
    setShowLogoutAlert(true);
  };

  const confirmLogout = () => {
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
      const response = await authService.switchRole(token, 'TRAVELER');
      setAuth(response.token, response.user);
      Toast.show({
        type: 'success',
        text1: 'Role Switched',
        text2: 'You are now in Traveler mode',
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'TravelerHome' }],
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

  return (
    <View style={s.container}>
      <StatusBar barStyle={theme.statusBar} translucent backgroundColor="transparent" />

      <SafeAreaView edges={['top']} style={s.headerNav}>
        <View style={s.navRow}>
          <BackButton 
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            color={theme.primary}
          />
          <Text style={s.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >

        <View style={s.settingsSection}>
          <Text style={s.sectionTitle}>Account Overview</Text>

          <TouchableOpacity 
            style={s.itemRow}
            onPress={() => navigation.navigate('PersonalDetails')}
          >
            <View style={s.itemIconBox}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5"><Circle cx="12" cy="7" r="4"/><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></Svg>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.itemLabel}>Personal Details</Text>
                <Text style={s.itemSubLabel}>Identify, Documents & Status</Text>
            </View>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.border} strokeWidth="2">
                <Path d="M9 18l6-6-6-6" />
            </Svg>
          </TouchableOpacity>

          {(!user?.isTravelerRequested && !user?.isTravelerApproved) ? (
            <TouchableOpacity 
              style={s.itemRow}
              onPress={() => navigation.navigate('RequestRole')}
            >
              <View style={s.itemIconBox}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5">
                      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <Circle cx="8.5" cy="7" r="4" />
                      <Path d="M20 8v6M23 11h-6" />
                  </Svg>
              </View>
              <View style={{ flex: 1 }}>
                  <Text style={s.itemLabel}>Become a Traveler</Text>
                  <Text style={s.itemSubLabel}>Unlock traveler & earning features</Text>
              </View>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.border} strokeWidth="2">
                  <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>
          ) : (user?.isTravelerRequested && !user?.isTravelerApproved) ? (
            <View style={[s.itemRow, { opacity: 0.7 }]}>
              <View style={s.itemIconBox}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="1.5">
                      <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </Svg>
              </View>
              <View style={{ flex: 1 }}>
                  <Text style={s.itemLabel}>Traveler Request Pending</Text>
                  <Text style={s.itemSubLabel}>We're currently verifying your documents</Text>
              </View>
            </View>
          ) : null}

          {user?.isTravelerApproved && (
            <TouchableOpacity
              style={s.switchRoleBtn}
              onPress={handleSwitchRole}
              disabled={switching}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.primary, theme.isDark ? '#004A38' : '#005a45']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={s.switchRoleContent}>
                <View style={s.switchIconBox}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                    <Path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                  </Svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchRoleTitle}>Switch to Traveler</Text>
                  <Text style={s.switchRoleSub}>Start earning by delivering parcels</Text>
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

          <Text style={[s.sectionTitle, { marginTop: 32 }]}>General</Text>
          <SettingsItem 
            icon="bell" 
            label="Notifications" 
            onPress={() => navigation.navigate('Notifications')}
            theme={theme}
            badgeCount={unreadCount}
          />
          <SettingsItem 
            icon="lock" 
            label="Account Security" 
            onPress={() => navigation.navigate('ChangePassword')}
            theme={theme}
          />
          <SettingsItem 
            icon="headset" 
            label="Help Center" 
            onPress={() => navigation.navigate('HelpCenter')}
            theme={theme}
          />
          
          <TouchableOpacity 
            style={s.logoutBtn}
            onPress={handleLogout}
          >
            <View style={s.logoutIconBox}>
               <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2">
                  <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <Path d="M16 17l5-5-5-5"/>
                  <Path d="M21 12H9"/>
               </Svg>
            </View>
            <Text style={s.logoutText}>Sign Out Account</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <CustomAlert
        visible={showLogoutAlert}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutAlert(false)}
        confirmText="Sign Out"
        type="warning"
      />
    </View>
  );
};

const SettingsItem = ({ icon, label, subLabel, onPress, theme, badgeCount }: any) => {
  const s = makeStyles(theme);
  return (
    <TouchableOpacity style={s.itemRow} activeOpacity={0.7} onPress={onPress}>
      <View style={s.itemIconBox}>
        {renderSettIcon(icon, theme.primary)}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.itemLabel}>{label}</Text>
        {subLabel && <Text style={s.itemSubLabel}>{subLabel}</Text>}
      </View>
      {badgeCount > 0 && (
        <View style={s.badgeContainer}>
          <Text style={s.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.border} strokeWidth="2">
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    </TouchableOpacity>
  );
};

const renderSettIcon = (name: string, color: string) => {
  const size = 20;
  if(name === 'bell') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>
  if(name === 'lock') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>
  if(name === 'help') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Circle cx="12" cy="12" r="10"/><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Path d="M12 17h.01"/></Svg>
  if(name === 'headset') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" /><Path d="M21 16v2a4 4 0 0 1-4 4h-5" /></Svg>
  return null;
}

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerNav: {
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
  },
  settingsSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    color: theme.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    paddingLeft: 4,
    fontFamily: Typography.bold,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: theme.border,
  },
  itemLabel: {
    fontSize: 15,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  itemSubLabel: {
    fontSize: 12,
    color: theme.text.secondary,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: theme.isDark ? 'rgba(225, 29, 72, 0.1)' : '#FFF1F2',
    gap: 12,
  },
  logoutIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.isDark ? 'rgba(225, 29, 72, 0.15)' : '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#E11D48',
    fontSize: 15,
    fontFamily: Typography.bold,
  },
  switchRoleBtn: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.shadowColor,
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
  badgeContainer: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Typography.bold,
  },
});

export default ProfileScreen;
