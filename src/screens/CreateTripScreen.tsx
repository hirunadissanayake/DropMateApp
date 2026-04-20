import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
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


const { width } = Dimensions.get('window');
const BRAND_GREEN = '#006C52';

const CreateTripScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuthStore();
  const isApproved = user?.isTravelerApproved === true;
  
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [exactLocation, setExactLocation] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [capacityKg, setCapacityKg] = useState('');
  const [travelTime, setTravelTime] = useState('');
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

  // Picker States
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);


  useEffect(() => {
    if (!isApproved) {
      setAlertConfig({
        title: 'Access Restricted',
        message: 'You cannot create a trip until your account has been approved by our admin team.',
        confirmText: 'OK',
        type: 'info',
        showCancel: false,
        action: () => {
          setAlertVisible(false);
          navigation.goBack();
        }
      });
      setAlertVisible(true);
    } else if (token) {
      fetchFromLocations();
    }
  }, [token, isApproved, navigation]);

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

  const handleSubmit = () => {
    if (!isFormValid) return;
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
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
              colors={[BRAND_GREEN]} 
              tintColor={BRAND_GREEN}
            />
          }
        >
          <LinearGradient
            colors={['#DCFBEB', '#F0FDF4', '#F8FAFC']}
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
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="#DC2626" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      setErrors(prev => ({ ...prev, fromLocation: '' }));
                    }}
                    placeholder="From where?"
                  />
                  <ErrorMessage message={errors.fromLocation} />
                  <View style={{ height: 12 }} />
                  <CustomDropdown
                    label=""
                    options={toLocationList}
                    selectedOption={toLocation}
                    onSelect={(val) => {
                      setToLocation(val);
                      setErrors(prev => ({ ...prev, toLocation: '' }));
                    }}
                    placeholder={fromLocation ? "To where?" : "Select start location"}
                    disabled={!fromLocation}
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
                  setErrors(prev => ({ ...prev, vehicleType: '' }));
                }}
                placeholder="Select vehicle type"
              />
              <ErrorMessage message={errors.vehicleType} />
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>EXACT LOCATION</Text>
              <TextInput
                style={[styles.minimalInput, errors.exactLocation ? { borderColor: '#DC2626' } : null]}
                placeholder="Where exactly?"
                placeholderTextColor="#94A3B8"
                value={exactLocation}
                onChangeText={(val) => {
                  setExactLocation(val);
                  setErrors(prev => ({ ...prev, exactLocation: '' }));
                }}
              />
              <ErrorMessage message={errors.exactLocation} />
              <Text style={{ fontSize: 13, color: '#64748B', fontFamily: Typography.regular, marginTop: 8, lineHeight: 18 }}>
                Tell the customer exactly where you will be (e.g., which bus stand, railway station, or landmark).
              </Text>
            </View>

            

            <View style={styles.contentCard}>
              <View style={styles.dualFields}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>TRAVEL DATE</Text>
                  <TouchableOpacity 
                    style={[styles.minimalInput, errors.travelDate ? { borderColor: '#DC2626' } : null]} 
                    onPress={() => setShowCalendar(true)}
                  >
                    <Text style={[styles.inputValue, !travelDate && { color: '#94A3B8' }]}>
                      {travelDate || 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                  <ErrorMessage message={errors.travelDate} />
                </View>

                <View style={{ width: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>CAPACITY (KG)</Text>
                  <TextInput
                    style={[styles.minimalInput, errors.capacityKg ? { borderColor: '#DC2626' } : null]}
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor="#94A3B8"
                    value={capacityKg}
                    onChangeText={(val) => {
                      setCapacityKg(val);
                      if (val && (isNaN(Number(val)) || Number(val) <= 0)) {
                        setErrors(prev => ({ ...prev, capacityKg: 'Enter valid capacity (kg)' }));
                      } else {
                        setErrors(prev => ({ ...prev, capacityKg: '' }));
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
                style={[styles.minimalInput, errors.travelTime ? { borderColor: '#DC2626' } : null]} 
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.inputValue, !travelTime && { color: '#94A3B8' }]}>
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
                placeholderTextColor="#94A3B8"
                multiline
                value={note}
                onChangeText={setNote}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.submitButton, 
                (!isFormValid || loading) && { opacity: 0.5, shadowOpacity: 0 }
              ]} 
              onPress={handleSubmit}
              disabled={loading || !isFormValid}
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
          onClose={() => setShowCalendar(false)}
          selectedDate={travelDate}
          onSelectDate={(val) => {
            setTravelDate(val);
            setErrors(prev => ({ ...prev, travelDate: '' }));
          }}
        />

        <CustomTimePicker
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          selectedTime={travelTime}
          onSelectTime={(val) => {
            setTravelTime(val);
            setErrors(prev => ({ ...prev, travelTime: '' }));
          }}
        />


        <CustomAlert
          visible={alertVisible}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
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
    fontSize: 32,
    color: '#0F172A',
    fontFamily: Typography.extraBold,
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontFamily: Typography.regular,
    lineHeight: 22,
    textAlign: 'center',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0FDF4',
  },
  fieldLabel: {
    fontSize: 11,
    color: '#000',
    fontFamily: Typography.bold,
    marginBottom: 10,
  },
  minimalInput: {
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Typography.medium,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
  },
  inputValue: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Typography.medium,
  },

  minimalTextArea: {
    minHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Typography.medium,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    textAlignVertical: 'top',
  },
  routeTimeline: {
    alignItems: 'center',
    paddingTop: 15,
  },
  routeDotStart: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ECFDF5',
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
    backgroundColor: '#059669',
  },
  dashedLine: {
    width: 1,
    height: 45,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
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
    height: 60,
    backgroundColor: BRAND_GREEN,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: Typography.bold,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
    fontFamily: Typography.bold,
  },
});

export default CreateTripScreen;
