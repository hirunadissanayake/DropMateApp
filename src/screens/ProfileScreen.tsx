import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
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

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, token, logout, setUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
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
  }, []);

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
        text1: 'Success',
        text2: 'Profile updated successfully',
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

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [token]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView edges={['top']} style={styles.headerNav}>
        <View style={styles.navRow}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 18l-6-6 6-6" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
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
          </View>
          
          {isEditing ? (
            <View style={styles.editNameWrapper}>
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter your name"
                  autoFocus
                />
              </View>
              <View style={styles.editActions}>
                 <TouchableOpacity 
                   onPress={handleCancel}
                   disabled={loading}
                   style={[styles.actionBtn, styles.cancelBtn]}
                 >
                   <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="3">
                      <Path d="M18 6L6 18M6 6l12 12"/>
                   </Svg>
                 </TouchableOpacity>
                 {(editedName.trim() !== (user?.name || '')) && (
                   <TouchableOpacity 
                     onPress={handleUpdateProfile}
                     disabled={loading}
                     style={[styles.actionBtn, styles.saveBtn]}
                   >
                     {loading ? (
                       <ActivityIndicator size="small" color="#FFF" />
                     ) : (
                       <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3">
                          <Path d="M20 6L9 17l-5-5"/>
                       </Svg>
                     )}
                   </TouchableOpacity>
                 )}
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.nameDisplayRow}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
              <View style={styles.nameEditIcon}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                  <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </Svg>
              </View>
            </TouchableOpacity>
          )}
          <Text style={styles.userEmail}>{user?.email || 'email@dropmate.app'}</Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account Overview</Text>
          
          <TouchableOpacity 
            style={styles.itemRow}
            onPress={() => navigation.navigate('PersonalDetails')}
          >
            <View style={styles.itemIconBox}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5"><Circle cx="12" cy="7" r="4"/><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></Svg>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemLabel}>Personal Details</Text>
                <Text style={styles.itemSubLabel}>Identify, Documents & Status</Text>
            </View>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                <Path d="M9 18l6-6-6-6" />
            </Svg>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>General</Text>
          <SettingsItem icon="bell" label="Notifications" />
          <SettingsItem icon="lock" label="Account Security" />
          <SettingsItem icon="help" label="Help Center" />
          
          <TouchableOpacity 
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <View style={styles.logoutIconBox}>
               <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2">
                  <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <Path d="M16 17l5-5-5-5"/>
                  <Path d="M21 12H9"/>
               </Svg>
            </View>
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
    <View style={styles.itemIconBox}>
      {renderSettIcon(icon)}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.itemLabel}>{label}</Text>
      {subLabel && <Text style={styles.itemSubLabel}>{subLabel}</Text>}
    </View>
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  </TouchableOpacity>
);

const renderSettIcon = (name: string) => {
  const size = 20;
  const color = "#006C52";
  if(name === 'bell') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>
  if(name === 'lock') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>
  if(name === 'help') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><Circle cx="12" cy="12" r="10"/><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Path d="M12 17h.01"/></Svg>
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerNav: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
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
    paddingTop: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#006C52',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    paddingLeft: 26,
  },
  userName: {
    fontSize: 22,
    color: '#0F172A',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  nameEditIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editNameWrapper: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  editNameContainer: {
    flex: 1,
  },
  nameInput: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#006C52',
    paddingVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  saveBtn: {
    backgroundColor: '#006C52',
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
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    paddingLeft: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
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
    color: '#1E293B',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  itemSubLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    gap: 12,
  },
  logoutIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#E11D48',
    fontWeight: '800',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
});

export default ProfileScreen;
