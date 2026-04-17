import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Dimensions, StatusBar, Image, ScrollView, RefreshControl } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import * as authService from '../services/authService';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, token, logout, setUser } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

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
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [token]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerNav}>
        <View style={styles.navRow}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 18l-6-6 6-6" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#006C52']}
            tintColor="#006C52"
          />
        }
      >
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
             {user?.selfieUrl ? (
               <Image source={{ uri: user.selfieUrl }} style={styles.avatarImage} />
             ) : (
               <Text style={styles.avatarInitial}>{getInitial(user?.name || '')}</Text>
             )}
             <TouchableOpacity style={styles.editBadge}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </Svg>
             </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@dropmate.app'}</Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <SettingsItem icon="user" label="Identity Details" subLabel={`NIC: ${user?.nicNumber || 'N/A'}`} />
          <SettingsItem icon="phone" label="Phone Number" subLabel={user?.phone} />
          
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Preferences</Text>
          <SettingsItem icon="bell" label="Notifications" />
          <SettingsItem icon="lock" label="Account Security" />
          <SettingsItem icon="help" label="Help Center" />
          
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Sign Out Account</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const SettingsItem = ({ icon, label, subLabel }: any) => (
  <TouchableOpacity style={styles.itemRow} activeOpacity={0.7}>
    <View style={styles.iconBox}>
      {renderSettIcon(icon)}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
    </View>
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  </TouchableOpacity>
);

const renderSettIcon = (name: string) => {
  const size = 20;
  if(name === 'user') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5"><Circle cx="12" cy="7" r="4"/><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></Svg>
  if(name === 'phone') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>
  if(name === 'bell') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5"><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>
  if(name === 'lock') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>
  if(name === 'help') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5"><Circle cx="12" cy="12" r="10"/><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Path d="M12 17h.01"/></Svg>
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerNav: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FFF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#006C52',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#006C52',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
  },
  userName: {
    fontSize: 24,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
  },
  settingsSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#F0FFF8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  subLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 40,
    backgroundColor: '#FFF1F2',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: '#E11D48',
    fontWeight: '800',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
});

export default ProfileScreen;
