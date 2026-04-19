import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuthStore } from '../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomDropdown from '../components/common/CustomDropdown';
import Toast from 'react-native-toast-message';
import * as authService from '../services/authService';
import { Typography } from '../constants/Typography';

const BRAND_GREEN = '#00875A';

const VehicleDetailsScreen = () => {
  const navigation = useNavigation();
  const { user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [vehicleType, setVehicleType] = useState(user?.vehicleType || 'Bus');
  const [weightCapacity, setWeightCapacity] = useState(user?.weightCapacity?.toString() || '');

  const vehicleOptions = ['Bus', 'Car', 'Motor bike', 'Train'];

  const hasChanges = 
    vehicleType !== (user?.vehicleType || '') || 
    weightCapacity !== (user?.weightCapacity?.toString() || '');

  const handleUpdate = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      await authService.updateProfile(token, {
        vehicleType,
        weightCapacity: parseFloat(weightCapacity) || 0,
      });
      
      // Update local state
      const updatedUser = await authService.getMe(token);
      setUser(updatedUser);
      
      Toast.show({
        type: 'success',
        text1: 'Update Success',
        text2: 'Vehicle details have been updated.',
      });
      navigation.goBack();
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

  const renderVehicleIcon = (type: string) => {
    const color = BRAND_GREEN;
    const size = 22;
    const vType = type.toLowerCase();

    if (vType === 'bus') {
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M19 5H5C3.34315 5 2 6.34315 2 8V17C2 18.6569 3.34315 20 5 20H19C20.6569 20 22 18.6569 22 17V8C22 6.34315 20.6569 5 19 5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M16 9V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M8 9V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M2 15H22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M6 20V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M18 20V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      );
    }
    if (vType === 'car') {
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M19 17H5C3.89543 17 3 16.1046 3 15V9.43147C3 8.71836 3.37617 8.05831 3.99222 7.69805L5.80735 6.62141C6.54924 6.18525 7.42065 5.97576 8.30397 6.01899L15.696 6.38075C16.5794 6.42399 17.4508 6.63348 18.1927 7.06964L20.0078 8.14628C20.6238 8.50654 21 9.1666 21 9.87971V15C21 16.1046 20.1046 17 19 17Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Circle cx="7" cy="17" r="2" stroke={color} strokeWidth="2"/>
          <Circle cx="17" cy="17" r="2" stroke={color} strokeWidth="2"/>
          <Path d="M14 9H10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      );
    }
    if (vType === 'motor bike' || vType === 'motorbike') {
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="5" cy="18" r="3" stroke={color} strokeWidth="2"/>
          <Circle cx="19" cy="18" r="3" stroke={color} strokeWidth="2"/>
          <Path d="M12 18V12L15 8H19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M8 18V13C8 13 8 10 11 10H14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      );
    }
    if (vType === 'train') {
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M7 15h10M7 11h10"/>
          <Rect x="5" y="5" width="14" height="12" rx="2" ry="2"/>
          <Path d="M8 21l2-4M16 21l-2-4"/>
        </Svg>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#F0FDF4', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView edges={['top']} style={styles.headerNav}>
        <View style={styles.navRow}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 18l-6-6 6-6" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle & Capacity</Text>
          <View style={styles.headerAction}>
              {hasChanges && (
                  <TouchableOpacity 
                    onPress={handleUpdate} 
                    disabled={loading}
                    style={styles.saveBtn}
                  >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3">
                            <Path d="M20 6L9 17l-5-5"/>
                        </Svg>
                    )}
                  </TouchableOpacity>
              )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
            <View style={styles.infoBox}>
                <View style={styles.infoIconBox}>
                    {renderVehicleIcon(vehicleType)}
                </View>
                <Text style={styles.infoText}>
                    Update your transport details to match with the most suitable shipments.
                </Text>
            </View>

            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Logistics Profile</Text>
                
                <View style={styles.dropdownWrapper}>
                    <Text style={styles.label}>Vehicle Type</Text>
                    <CustomDropdown 
                        options={vehicleOptions}
                        selectedOption={vehicleType}
                        onSelect={setVehicleType}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={styles.label}>Max Weight Capacity</Text>
                    <View style={styles.inputContainer}>
                        <TextInput 
                            style={styles.textInput}
                            value={weightCapacity}
                            onChangeText={setWeightCapacity}
                            keyboardType="numeric"
                            placeholder="e.g. 5.0"
                        />
                        <View style={styles.unitBadge}>
                            <Text style={styles.unitText}>kg</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
      </ScrollView>
    </View>
  );
};

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
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: Typography.bold,
  },
  headerAction: {
      width: 40,
      alignItems: 'flex-end',
  },
  saveBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: BRAND_GREEN,
      alignItems: 'center',
      justifyContent: 'center',
  },
  scrollContent: {
      paddingTop: 24,
  },
  contentPadding: {
      paddingHorizontal: 16,
  },
  infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: '#F1F5F9',
      marginBottom: 24,
  },
  infoIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F0FDF4',
      alignItems: 'center',
      justifyContent: 'center',
  },
  infoText: {
      flex: 1,
      fontSize: 13,
      color: '#475569',
      lineHeight: 18,
      fontWeight: '500',
  },
  formCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: '#F1F5F9',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.02,
      shadowRadius: 10,
      elevation: 2,
  },
  sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#0F172A',
      marginBottom: 24,
  },
  dropdownWrapper: {
      marginBottom: 20,
  },
  label: {
      fontSize: 11,
      fontWeight: '700',
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      paddingLeft: 4,
  },
  inputWrapper: {
      marginBottom: 10,
  },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#F1F5F9',
      height: 56,
      paddingHorizontal: 16,
  },
  textInput: {
      flex: 1,
      fontSize: 16,
      color: '#1E293B',
      fontWeight: '700',
  },
  unitBadge: {
      backgroundColor: '#E2E8F0',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
  },
  unitText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#64748B',
  },
});

export default VehicleDetailsScreen;
