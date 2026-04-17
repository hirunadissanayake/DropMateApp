import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.profileAvatar}>
             <Text style={styles.avatarInitial}>E</Text>
          </View>
          <Text style={styles.userName}>Elena Gilbert</Text>
          <Text style={styles.userEmail}>elena@dropmate.app</Text>
        </View>

        <View style={styles.settingsSection}>
          <SettingsItem icon="user" label="Personal Documents" />
          <SettingsItem icon="bell" label="Notifications" />
          <SettingsItem icon="lock" label="Account Security" />
          <SettingsItem icon="help" label="Help Center" />
          
          <TouchableOpacity style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const SettingsItem = ({ icon, label }: any) => (
  <TouchableOpacity style={styles.itemRow} activeOpacity={0.7}>
    <View style={styles.iconBox}>
      {renderSettIcon(icon)}
    </View>
    <Text style={styles.label}>{label}</Text>
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  </TouchableOpacity>
);

const renderSettIcon = (name: string) => {
  const size = 20;
  if(name === 'user') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5"><Circle cx="12" cy="7" r="4"/><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></Svg>
  if(name === 'bell') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5"><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>
  if(name === 'lock') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>
  if(name === 'help') return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5"><Circle cx="12" cy="12" r="10"/><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Path d="M12 17h.01"/></Svg>
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 30,
  },
  header: {
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
    marginBottom: 16,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  userName: {
    fontSize: 22,
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
    paddingHorizontal: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  logoutBtn: {
    marginTop: 40,
    backgroundColor: '#FFF1F2',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#BE123C',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ProfileScreen;
