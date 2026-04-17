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
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Editable fields
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedVehicleType, setEditedVehicleType] = useState(user?.vehicleType || '');
  const [editedWeightCapacity, setEditedWeightCapacity] = useState(user?.weightCapacity?.toString() || '');

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const userData = await authService.getMe(token);
      setUser(userData);
      setEditedName(userData.name);
      setEditedVehicleType(userData.vehicleType || '');
      setEditedWeightCapacity(userData.weightCapacity?.toString() || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      await authService.updateProfile(token, {
        name: editedName,
        vehicleType: editedVehicleType,
        weightCapacity: parseFloat(editedWeightCapacity) || 0,
      });
      await fetchProfile();
      setIsEditing(false);
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your traveler profile has been updated successfully.',
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
    setEditedVehicleType(user?.vehicleType || '');
    setEditedWeightCapacity(user?.weightCapacity?.toString() || '');
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
              {/* <TouchableOpacity style={styles.cameraIconBtn}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <Circle cx="12" cy="13" r="4"/>
                </Svg>
              </TouchableOpacity> */}
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
                    {(editedName.trim() !== (user?.name || '') || 
                      editedVehicleType.trim() !== (user?.vehicleType || '') || 
                      editedWeightCapacity.trim() !== (user?.weightCapacity?.toString() || '')) && (
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
                {/* <View style={styles.ratingBadge}>
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="#FACC15">
                    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </Svg>
                  <Text style={styles.ratingText}>{user?.rating || '5.0'}</Text>
                </View> */}
              </View>
            </View>
          </View>

          {/* Traveler Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Vehicle & Capacity</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                   <Text style={styles.sectionEditLink}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.infoCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Type</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={editedVehicleType}
                    onChangeText={setEditedVehicleType}
                    placeholder="e.g. Bike, Car, Bus"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user?.vehicleType || 'Not specified'}</Text>
                )}
              </View>
              
              <View style={[styles.inputGroup, { borderBottomWidth: 0 }]}>
                <Text style={styles.inputLabel}>Weight Capacity (kg)</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.infoInput}
                    value={editedWeightCapacity}
                    onChangeText={setEditedWeightCapacity}
                    placeholder="e.g. 5.0"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user?.weightCapacity ? `${user.weightCapacity} kg` : 'Not specified'}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Account Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Account Details</Text>
            <SettingsItem 
              icon="file-text" 
              label="ID Document" 
              subLabel={`NIC: ${user?.nicNumber || 'N/A'}`} 
              isReadOnly
            />
            <SettingsItem 
              icon="phone" 
              label="Phone Number" 
              subLabel={user?.phone} 
              isReadOnly
            />
            <SettingsItem icon="bell" label="Notification Settings" />
            <SettingsItem icon="lock" label="Account Security" />
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


const SettingsItem = ({ icon, label, subLabel, isReadOnly }: any) => (
  <TouchableOpacity 
    style={styles.itemRow}
    disabled={isReadOnly}
    activeOpacity={isReadOnly ? 1 : 0.7}
  >
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
    {!isReadOnly && (
      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    )}
  </TouchableOpacity>
);

const renderIcon = (name: string) => {
  if (name === 'file-text') return (
    <>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </>
  );
  if (name === 'phone') return <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>;
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  scrollContent: {
    paddingHorizontal: 24,
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
    fontWeight: '800',
  },
  cameraIconBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_GREEN,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingLeft: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  editBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND_GREEN,
    paddingVertical: 8,
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
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionEditLink: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_GREEN,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputGroup: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoInput: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_GREEN,
    padding: 0,
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
    fontSize: 15,
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
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
});

export default TravelerProfileScreen;
