import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Image,
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

const BRAND_GREEN = '#00875A';
const BRAND_LIGHT = '#E6F5EF';

const TravelerProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, token, logout, setUser } = useAuthStore();

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const userData = await authService.getMe(token);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  React.useEffect(() => {
    fetchProfile();
  }, []);

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

  const getInitial = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
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
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Profile Card */}
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
              <TouchableOpacity style={styles.editIconBtn}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </Svg>
              </TouchableOpacity>
            </View>
            
            <View style={styles.userMeta}>
              <Text style={styles.userName}>{user?.name || 'Traveler'}</Text>
              <View style={badgeRowStyles.badgeRow}>
                <View style={[styles.statusBadge, { backgroundColor: user?.isTravelerApproved ? BRAND_LIGHT : '#FEE2E2' }]}>
                  <Text style={[styles.statusText, { color: user?.isTravelerApproved ? BRAND_GREEN : '#EF4444' }]}>
                    {user?.isTravelerApproved ? 'Verified Traveler' : 'Pending Verification'}
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="#FACC15">
                    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </Svg>
                  <Text style={styles.ratingText}>{user?.rating || '0.0'} Trust: {user?.trustScore || '0'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Verification Status */}
          {user?.isTravelerApproved ? (
            <View style={styles.verificationCard}>
              <View style={styles.verifiIconBox}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="2">
                  <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <Path d="M22 4L12 14.01l-3-3" />
                </Svg>
              </View>
              <View style={styles.verifiContent}>
                <Text style={styles.verifiTitle}>Account Verified</Text>
                <Text style={styles.verifiDesc}>You have full access to all delivery services and routes.</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.verificationCard, { borderColor: '#FEE2E2', shadowColor: '#EF4444' }]}>
              <View style={[styles.verifiIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 8v4" />
                  <Path d="M12 16h.01" />
                </Svg>
              </View>
              <View style={styles.verifiContent}>
                <Text style={styles.verifiTitle}>Under Review</Text>
                <Text style={styles.verifiDesc}>Your documents are being processed. This usually takes 24-48 hours.</Text>
              </View>
            </View>
          )}

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Traveler Settings</Text>
            <SettingsItem icon="file-text" label="Personal Documents" subLabel={`NIC: ${user?.nicNumber}`} />
            <SettingsItem icon="truck" label="Vehicle Details" subLabel={user?.vehicleType ? `${user.vehicleType} - ${user.weightCapacity}kg` : 'Not set'} />
            <SettingsItem icon="phone" label="Phone Number" subLabel={user?.phone} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Account</Text>
            <SettingsItem icon="bell" label="Notifications" />
            <SettingsItem icon="lock" label="Security" />
            <SettingsItem icon="help-circle" label="Help Center" />
          </View>

          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Sign Out Account</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};


const SettingsItem = ({ icon, label, subLabel }: any) => (
  <TouchableOpacity style={styles.itemRow}>
    <View style={styles.itemLeft}>
      <View style={styles.itemIconBox}>
        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {renderIcon(icon)}
        </Svg>
      </View>
      <View>
        <Text style={styles.itemLabel}>{label}</Text>
        {subLabel && <Text style={styles.itemSubLabel}>{subLabel}</Text>}
      </View>
    </View>
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  </TouchableOpacity>
);

const renderIcon = (name: string) => {
  if (name === 'file-text') return (
    <>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </>
  );
  if (name === 'credit-card') return (
    <>
      <Rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <Path d="M1 10h22"/>
    </>
  );
  if (name === 'truck') return (
    <>
      <Rect x="1" y="3" width="15" height="13" />
      <Path d="M16 8l4 0l3 3l0 5l-7 0" />
      <Circle cx="5.5" cy="18.5" r="2.5" />
      <Circle cx="18.5" cy="18.5" r="2.5" />
    </>
  );
  if (name === 'phone') return <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>;
  if (name === 'navigation') return <Path d="M3 11l19-9-9 19-2-8-8-2z"/>;

  if (name === 'bell') return (
    <>
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </>
  );
  if (name === 'lock') return (
    <>
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <Path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </>
  );
  if (name === 'help-circle') return (
    <>
      <Circle cx="12" cy="12" r="10"/>
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <Path d="M12 17h.01"/>
    </>
  );
  return null;
};

const badgeRowStyles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
});

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
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
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
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 2,
    borderWidth: 2,
    borderColor: BRAND_GREEN,
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
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
    fontSize: 40,
    fontWeight: '800',
  },
  editIconBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND_GREEN,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMeta: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: BRAND_GREEN + '20',
    marginBottom: 32,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  verifiIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiContent: {
    flex: 1,
  },
  verifiTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  verifiDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '700',
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
    marginTop: 10,
  },
  logoutText: {
    color: '#E11D48',
    fontWeight: '800',
    fontSize: 16,
  },
});

export default TravelerProfileScreen;
