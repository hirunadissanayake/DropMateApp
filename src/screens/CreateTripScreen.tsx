import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import * as tripService from '../services/tripService';
import Toast from 'react-native-toast-message';
import CustomDropdown from '../components/common/CustomDropdown';
import BackButton from '../components/common/BackButton';
import CustomAlert from '../components/common/CustomAlert';
import CustomCalendar from '../components/common/CustomCalendar';
import CustomTimePicker from '../components/common/CustomTimePicker';
import { Typography } from '../constants/Typography';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const { width } = Dimensions.get('window');

const CreateTripScreen = () => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [exactLocation, setExactLocation] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [capacityKg, setCapacityKg] = useState('');
  const [travelTime, setTravelTime] = useState('');
  const [pickupUrl, setPickupUrl] = useState('');
  const [dropoffUrl, setDropoffUrl] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  
  const vehicleOptions = ['Bus', 'Car', 'Motor bike', 'Train'];
  
  const [fromLocationList, setFromLocationList] = useState<string[]>([]);
  const [toLocationList, setToLocationList] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string, 
    message: string, 
    confirmText: string, 
    cancelText?: string,
    type?: 'success' | 'warning' | 'error' | 'info', 
    showCancel?: boolean,
    action: () => void
  }>({
    title: '',
    message: '',
    confirmText: '',
    action: () => {}
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchFromLocations();
      }
    }, [token])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setErrors({});
    if (token) {
      await fetchFromLocations();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (token && fromLocation) {
      fetchToLocations();
    } else {
      setToLocationList([]);
      setToLocation('');
    }
  }, [fromLocation, token]);

  const fetchFromLocations = async () => {
    try {
      const locations = await tripService.getFromLocations(token!);
      setFromLocationList(locations);
    } catch (err) {
      console.error('Fetch from locations error:', err);
    }
  };

  const fetchToLocations = async () => {
    try {
      const locations = await tripService.getToLocations(token!, fromLocation);
      setToLocationList(locations);
    } catch (err) {
      console.error('Fetch to locations error:', err);
    }
  };

  const ErrorMessage = ({ message }: { message: string }) => {
    if (!message) return null;
    return <Text style={styles.errorText}>{message}</Text>;
  };

  const isFormValid = 
    Boolean(fromLocation) &&
    Boolean(toLocation) &&
    Boolean(exactLocation) &&
    Boolean(vehicleType) &&
    Boolean(travelDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(travelDate) &&
    Boolean(capacityKg) && !isNaN(Number(capacityKg)) && Number(capacityKg) > 0 &&
    Boolean(travelTime);

  const handlePostPress = () => {
    const newErrors: Record<string, string> = {};

    if (!fromLocation) newErrors.fromLocation = 'Please select a pickup location';
    if (!toLocation) newErrors.toLocation = 'Please select a destination';
    if (!vehicleType) newErrors.vehicleType = 'Please select a vehicle type';
    if (!exactLocation) newErrors.exactLocation = 'Please provide meeting points';
    if (!travelDate) newErrors.travelDate = 'Please select a travel date';
    if (!capacityKg || isNaN(Number(capacityKg)) || Number(capacityKg) <= 0) {
      newErrors.capacityKg = 'Please enter a valid capacity in Kg';
    }
    if (!travelTime) newErrors.travelTime = 'Please select a travel time';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Toast.show({ type: 'error', text1: 'Required Fields', text2: 'Please fill in all mandatory details.' });
      return;
    }

    setErrors({});
    setAlertConfig({
      title: 'Create Trip',
      message: 'Are you sure you want to post this trip? Please verify the locations and date.',
      confirmText: 'Yes, Post',
      cancelText: 'Review',
      showCancel: true,
      action: handleFinalSubmit
    });
    setAlertVisible(true);
  };

  const handleFinalSubmit = async () => {
    setAlertVisible(false);
    setLoading(true);
    try {
      const data = {
        fromLocation,
        toLocation,
        exactLocation,
        vehicleType,
        travelDate,
        capacityKg: parseFloat(capacityKg),
        travelTime: travelTime || null,
        pickupUrl: pickupUrl || '',
        dropoffUrl: dropoffUrl || '',
        note: note || '',
        status: 'ACTIVE'
      };

      await tripService.createTrip(token!, data);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Trip created successfully!' });
      navigation.goBack();
    } catch (error: any) {
      console.error('Create trip error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to create trip',
        text2: error.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.stickyHeader}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
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
          <LinearGradient
            colors={theme.isDark ? ['rgba(16, 185, 129, 0.05)', 'rgba(5, 150, 105, 0.02)', theme.background] : ['#DCFBEB', '#F0FDF4', theme.background]}
            style={styles.backgroundGradient}
          />

          <View style={styles.contentPadding}>
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Post a Trip</Text>
              <Text style={styles.heroSubtitle}>Share your travel schedule and earn by carrying parcels.</Text>
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>ROUTE DETAILS</Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={styles.routeTimeline}>
                  <View style={styles.routeDotStart}>
                    <View style={styles.routeDotInner} />
                  </View>
                  <View style={styles.dashedLine} />
                  <View style={styles.routePinEnd}>
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <Circle cx="12" cy="10" r="3" fill="#FFFFFF" />
                    </Svg>
                  </View>
                </View>
                <View style={styles.routeInputs}>
                  <CustomDropdown
                    label=""
                    options={fromLocationList}
                    selectedOption={fromLocation}
                    onSelect={(val) => {
                      setFromLocation(val);
                      setErrors(prev => {
                        const { fromLocation, ...rest } = prev;
                        return rest;
                      });
                    }}
                    placeholder="From where?"
                    theme={theme}
                  />
                  <ErrorMessage message={errors.fromLocation} />
                  <View style={{ height: 12 }} />
                  <CustomDropdown
                    label=""
                    options={toLocationList}
                    selectedOption={toLocation}
                    onSelect={(val) => {
                      setToLocation(val);
                      setErrors(prev => {
                        const { toLocation, ...rest } = prev;
                        return rest;
                      });
                    }}
                    placeholder={fromLocation ? "To where?" : "Select start location"}
                    disabled={!fromLocation}
                    theme={theme}
                  />
                  <ErrorMessage message={errors.toLocation} />
                </View>
              </View>
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>VEHICLE TYPE</Text>
              <CustomDropdown
                label=""
                options={vehicleOptions}
                selectedOption={vehicleType}
                onSelect={(val) => {
                  setVehicleType(val);
                  setErrors(prev => {
                    const { vehicleType, ...rest } = prev;
                    return rest;
                  });
                }}
                placeholder="Select vehicle type"
                theme={theme}
              />
              <ErrorMessage message={errors.vehicleType} />
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>EXACT MEETING POINTS (GPS LINKS)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.innerLabel}>Pickup GPS Link</Text>
                <TextInput
                  style={styles.minimalInput}
                  placeholder="Paste Google Maps URL here"
                  placeholderTextColor={theme.text.tertiary}
                  value={pickupUrl}
                  onChangeText={setPickupUrl}
                />
              </View>

              <View style={[styles.inputWrapper, { marginTop: 16 }]}>
                <Text style={styles.innerLabel}>Drop-off GPS Link</Text>
                <TextInput
                  style={styles.minimalInput}
                  placeholder="Paste Google Maps URL here"
                  placeholderTextColor={theme.text.tertiary}
                  value={dropoffUrl}
                  onChangeText={setDropoffUrl}
                />
              </View>
              <Text style={styles.helpText}>
                Open Google Maps, long-press your location, click "Share," and paste the link here.
              </Text>
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>LOCATION INSTRUCTIONS</Text>
              <TextInput
                style={[styles.minimalInput, errors.exactLocation ? { borderColor: '#EF4444' } : null]}
                placeholder="Where exactly? (e.g. Near School)"
                placeholderTextColor={theme.text.tertiary}
                value={exactLocation}
                onChangeText={(val) => {
                  setExactLocation(val);
                  setErrors(prev => {
                    const { exactLocation, ...rest } = prev;
                    return rest;
                  });
                }}
              />
              <ErrorMessage message={errors.exactLocation} />
            </View>

            <View style={styles.contentCard}>
              <View style={styles.dualFields}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>TRAVEL DATE</Text>
                  <TouchableOpacity 
                    style={[styles.minimalInput, errors.travelDate ? { borderColor: '#EF4444' } : null]} 
                    onPress={() => setShowCalendar(true)}
                  >
                    <Text style={[styles.inputValue, !travelDate && { color: theme.text.tertiary }]}>
                      {travelDate || 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                  <ErrorMessage message={errors.travelDate} />
                </View>

                <View style={{ width: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>CAPACITY (KG)</Text>
                  <TextInput
                    style={[styles.minimalInput, errors.capacityKg ? { borderColor: '#EF4444' } : null]}
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor={theme.text.tertiary}
                    value={capacityKg}
                    onChangeText={(val) => {
                      setCapacityKg(val);
                      if (val && (isNaN(Number(val)) || Number(val) <= 0)) {
                        setErrors(prev => ({ ...prev, capacityKg: 'Enter valid capacity' }));
                      } else {
                        setErrors(prev => {
                          const { capacityKg, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                  />
                  <ErrorMessage message={errors.capacityKg} />
                </View>
              </View>
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>TRAVEL TIME</Text>
              <TouchableOpacity 
                style={[styles.minimalInput, errors.travelTime ? { borderColor: '#EF4444' } : null]} 
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.inputValue, !travelTime && { color: theme.text.tertiary }]}>
                  {travelTime || 'Select Time'}
                </Text>
              </TouchableOpacity>
              <ErrorMessage message={errors.travelTime} />
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
              <TextInput
                style={[styles.minimalTextArea, { minHeight: 80 }]}
                placeholder="Any specific details about your trip?"
                placeholderTextColor={theme.text.tertiary}
                multiline
                value={note}
                onChangeText={setNote}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.submitButton, 
                loading && { opacity: 0.5 }
              ]} 
              onPress={handlePostPress}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Trip</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
        <CustomCalendar
          visible={showCalendar}
          theme={theme}
          onClose={() => setShowCalendar(false)}
          selectedDate={travelDate}
          onSelectDate={(val) => {
            setTravelDate(val);
            setErrors(prev => ({ ...prev, travelDate: '' }));
          }}
        />

        <CustomTimePicker
          visible={showTimePicker}
          theme={theme}
          onClose={() => setShowTimePicker(false)}
          selectedTime={travelTime}
          onSelectTime={(val) => {
            setTravelTime(val);
            setErrors(prev => ({ ...prev, travelTime: '' }));
          }}
        />

        <CustomAlert
          visible={alertVisible}
          theme={theme}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText || "Cancel"}
          type={alertConfig.type}
          showCancel={alertConfig.showCancel}
          onConfirm={alertConfig.action}
          onCancel={() => setAlertVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function makeStyles(theme: AppTheme) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
  },
  stickyHeader: {
    paddingTop: 10,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
    lineHeight: 22,
    textAlign: 'center',
  },
  contentCard: {
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: theme.isDark ? '#000' : theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  fieldLabel: {
    fontSize: 11,
    color: theme.text.tertiary,
    fontFamily: Typography.extraBold,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  minimalInput: {
    height: 52,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
  },
  inputValue: {
    fontSize: 15,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  inputWrapper: {
    marginBottom: 4,
  },
  innerLabel: {
    fontSize: 10,
    color: theme.text.tertiary,
    fontFamily: Typography.extraBold,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  minimalTextArea: {
    minHeight: 120,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: theme.text.primary,
    fontFamily: Typography.medium,
    borderWidth: 1,
    borderColor: theme.border,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
    marginTop: 12,
    lineHeight: 18,
  },
  routeTimeline: {
    alignItems: 'center',
    paddingTop: 15,
  },
  routeDotStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
    marginTop: 12,
  },
  routeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  dashedLine: {
    width: 1,
    height: 45,
    borderWidth: 0.5,
    borderColor: theme.border,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  routePinEnd: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInputs: {
    flex: 1,
  },
  dualFields: {
    flexDirection: 'row',
  },
  submitButton: {
    height: 58,
    backgroundColor: theme.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Typography.extraBold,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: Typography.bold,
  },
});
}


export default CreateTripScreen;
