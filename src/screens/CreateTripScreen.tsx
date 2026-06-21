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
import * as tripTemplateService from '../services/tripTemplateService';
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
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [initialTemplateData, setInitialTemplateData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);



  
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
        fetchTemplates();
      }
    }, [token])
  );


  const onRefresh = async () => {
    setRefreshing(true);
    setErrors({});
    if (token) {
      await Promise.all([fetchFromLocations(), fetchTemplates()]);
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

  useEffect(() => {
    if (isEditMode && initialTemplateData) {
      const changed = 
        (templateName || '') !== (initialTemplateData.templateName || '') ||
        (fromLocation || '') !== (initialTemplateData.fromLocation || '') ||
        (toLocation || '') !== (initialTemplateData.toLocation || '') ||
        (exactLocation || '') !== (initialTemplateData.exactLocation || '') ||
        (vehicleType || '') !== (initialTemplateData.vehicleType || '') ||
        (capacityKg || '') !== (initialTemplateData.capacityKg?.toString() || '') ||
        (travelTime || '') !== (initialTemplateData.travelTime || '') ||
        (pickupUrl || '') !== (initialTemplateData.pickupUrl || '') ||
        (dropoffUrl || '') !== (initialTemplateData.dropoffUrl || '') ||
        (note || '') !== (initialTemplateData.note || '');
      
      setHasChanges(changed);
    } else {
      setHasChanges(false);
    }
  }, [
    isEditMode, initialTemplateData, templateName, fromLocation, toLocation, 
    exactLocation, vehicleType, capacityKg, travelTime, pickupUrl, dropoffUrl, note
  ]);


  const fetchFromLocations = async () => {
    setFromLoading(true);
    try {
      const locations = await tripService.getFromLocations(token!);
      setFromLocationList(locations);
    } catch (err) {
      console.error('Fetch from locations error:', err);
    } finally {
      setFromLoading(false);
    }
  };

  const fetchToLocations = async () => {
    setToLoading(true);
    try {
      const locations = await tripService.getToLocations(token!, fromLocation);
      setToLocationList(locations);
    } catch (err) {
      console.error('Fetch to locations error:', err);
    } finally {
      setToLoading(false);
    }
  };

  const resetForm = () => {
    setFromLocation('');
    setToLocation('');
    setExactLocation('');
    setVehicleType('');
    setTravelDate('');
    setCapacityKg('');
    setTravelTime('');
    setPickupUrl('');
    setDropoffUrl('');
    setNote('');
    setSaveAsTemplate(false);
    setTemplateName('');
    setAppliedTemplateId(null);
    setIsEditMode(false);
    setErrors({});
  };
  
  const fetchTemplates = async () => {

    setTemplatesLoading(true);
    try {
      const data = await tripTemplateService.getMyTemplates(token!);
      setTemplates(data);
    } catch (err) {
      console.error('Fetch templates error:', err);
    } finally {
      setTemplatesLoading(false);
    }
    setErrors({});
  };

  const handleEditTemplatePress = (template: any) => {
    setAppliedTemplateId(template.id);
    setIsEditMode(true);
    setInitialTemplateData(template);
    setSaveAsTemplate(false);

    setTemplateName(template.templateName);
    
    setFromLocation(template.fromLocation);
    setToLocation(template.toLocation);
    setVehicleType(template.vehicleType || '');
    setCapacityKg(template.capacityKg?.toString() || '');
    setTravelTime(template.travelTime || '');
    setExactLocation(template.exactLocation || '');
    setPickupUrl(template.pickupUrl || '');
    setDropoffUrl(template.dropoffUrl || '');
    setNote(template.note || '');

    // Scroll to top or just give feedback
    Toast.show({
      type: 'info',
      text1: 'Editing Favorite',
      text2: `Updating ${template.templateName}`
    });
  };

  const handleDeleteTemplate = (id: string, name: string) => {

    setAlertConfig({
      title: 'Delete Favorite',
      message: `Are you sure you want to remove "${name}" from your favorites?`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'warning',
      showCancel: true,
      action: async () => {
        setAlertVisible(false);
        try {
          await tripTemplateService.deleteTemplate(token!, id);
          Toast.show({ type: 'success', text1: 'Deleted', text2: 'Favorite removed successfully' });
          fetchTemplates();
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete template' });
        }
      }
    });
    setAlertVisible(true);
  };

  const applyTemplate = (template: any) => {
    setAppliedTemplateId(template.id);
    setIsEditMode(false);
    setSaveAsTemplate(false);
    
    setFromLocation(template.fromLocation);
    setToLocation(template.toLocation);
    setVehicleType(template.vehicleType || '');
    setCapacityKg(template.capacityKg?.toString() || '');
    setTravelTime(template.travelTime || '');
    setExactLocation(template.exactLocation || '');
    setPickupUrl(template.pickupUrl || '');
    setDropoffUrl(template.dropoffUrl || '');
    setNote(template.note || '');
    
    Toast.show({
      type: 'info',
      text1: 'Template Applied',
      text2: `Working with ${template.templateName}`
    });
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
    if (!isEditMode && !travelDate) newErrors.travelDate = 'Please select a travel date';
    if (!capacityKg || isNaN(Number(capacityKg)) || Number(capacityKg) <= 0) {
      newErrors.capacityKg = 'Please enter a valid capacity in Kg';
    }
    if (!travelTime) newErrors.travelTime = 'Please select a travel time';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Toast.show({ type: 'error', text1: 'Required Fields', text2: 'Please fill in all mandatory details.' });
      return;
    }

    if (isEditMode) {
        handleFinalSubmit(); // No alert needed for template updates
        return;
    }

    setErrors({});

    
    if (saveAsTemplate && !templateName) {
        setErrors(prev => ({ ...prev, templateName: 'Enter a name for your template' }));
        Toast.show({ type: 'error', text1: 'Template Name Required' });
        return;
    }

    setAlertConfig({
      title: 'Create Trip',
      message: saveAsTemplate 
        ? `Are you sure you want to post this trip and save "${templateName}" as a template?`
        : 'Are you sure you want to post this trip? Please verify the locations and date.',
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
      if (isEditMode && appliedTemplateId) {
        const templateData = {
          templateName,
          fromLocation,
          toLocation,
          exactLocation,
          vehicleType,
          capacityKg: parseFloat(capacityKg),
          travelTime,
          pickupUrl,
          dropoffUrl,
          note
        };
        await tripTemplateService.updateTemplate(token!, appliedTemplateId, templateData);
        Toast.show({ type: 'success', text1: 'Updated', text2: 'Favorite updated successfully!' });
        resetForm();
        fetchTemplates();
        setLoading(false);
        return;
      }


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

      if (saveAsTemplate) {
        const templateData = {
          templateName,
          fromLocation,
          toLocation,
          exactLocation,
          vehicleType,
          capacityKg: parseFloat(capacityKg),
          travelTime,
          pickupUrl,
          dropoffUrl,
          note
        };
        await tripTemplateService.createTemplate(token!, templateData);
      }

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
          <View style={styles.backButtonContainer}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Favorite' : 'Post a Trip'}</Text>
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
              <Text style={styles.heroSubtitle}>Share your travel schedule and earn by carrying parcels.</Text>
            </View>

            { (templates.length > 0 || templatesLoading) && (
              <View style={styles.templatesSection}>
                <Text style={styles.fieldLabel}>QUICK START FROM FAVORITES</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.templatesScroll}
                >
                  {templatesLoading ? (
                    // Skeleton Loading Cards
                    [1, 2, 3].map((i) => (
                      <View key={i} style={[styles.templateCard, { opacity: 0.6 }]}>
                         <View style={[styles.templateIcon, { backgroundColor: theme.border }]} />
                         <View style={{ height: 14, backgroundColor: theme.border, borderRadius: 4, width: '80%', marginBottom: 6 }} />
                         <View style={{ height: 10, backgroundColor: theme.border, borderRadius: 3, width: '60%' }} />
                      </View>
                    ))
                  ) : (
                    templates.map((item) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.templateCard}
                        onPress={() => applyTemplate(item)}
                      >
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                          <View style={styles.templateIcon}>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
                              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </Svg>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                              <TouchableOpacity 
                                  style={styles.templateActionBtn}
                                  onPress={() => handleEditTemplatePress(item)}
                              >
                                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                                  <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </Svg>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                  style={[styles.templateActionBtn]}
                                  onPress={() => handleDeleteTemplate(item.id, item.templateName)}
                              >
                                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                                  <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </Svg>
                              </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={styles.templateName} numberOfLines={1}>{item.templateName}</Text>
                        <Text style={styles.templateRoute}>{item.fromLocation} → {item.toLocation}</Text>

                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}


            {isEditMode && (
                <View style={[styles.contentCard, { borderColor: theme.primary, borderLeftWidth: 8 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={styles.fieldLabel}>FAVORITE NAME (EDITING)</Text>
                        <TouchableOpacity onPress={resetForm}>
                             <Text style={{ color: '#EF4444', fontFamily: Typography.bold, fontSize: 12 }}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.minimalInput]}
                        placeholder="e.g. Daily Kandy Route"
                        placeholderTextColor={theme.text.tertiary}
                        value={templateName}
                        onChangeText={setTemplateName}
                    />
                    <Text style={[styles.helpText, { color: theme.primary, marginTop: 10 }]}>
                        You are updating this favorite. Click "Update Favorite" at the bottom to save.
                    </Text>
                </View>
            )}

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
                    label="FROM *"
                    options={fromLocationList}
                    selectedOption={fromLocation}
                    onSelect={(val) => {
                      setFromLocation(val);
                      setErrors(prev => {
                        const { fromLocation, ...rest } = prev;
                        return rest;
                      });
                    }}
                    placeholder="Select City"
                    theme={theme}
                    isLoading={fromLoading}
                  />
                  <ErrorMessage message={errors.fromLocation} />
                  <View style={{ height: 12 }} />
                  <CustomDropdown
                    label="TO *"
                    options={toLocationList}
                    selectedOption={toLocation}
                    onSelect={(val) => {
                      setToLocation(val);
                      setErrors(prev => {
                        const { toLocation, ...rest } = prev;
                        return rest;
                      });
                    }}
                    placeholder="Select City"
                    disabled={!fromLocation}
                    theme={theme}
                    isLoading={toLoading}
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
              <Text style={styles.fieldLabel}>EXACT MEETING POINTS (OPTIONAL)</Text>
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
                    style={[styles.minimalInput, (!isEditMode && errors.travelDate) ? { borderColor: '#EF4444' } : null]} 
                    onPress={() => setShowCalendar(true)}
                  >
                    <Text style={[styles.inputValue, !travelDate && { color: theme.text.tertiary }]}>
                      {travelDate || 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                  {!isEditMode && <ErrorMessage message={errors.travelDate} />}
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

            {!appliedTemplateId && !isEditMode && (
                <View style={styles.contentCard}>
                <TouchableOpacity 
                    style={styles.templateToggle}
                    onPress={() => setSaveAsTemplate(!saveAsTemplate)}
                >
                    <View style={[styles.checkbox, saveAsTemplate && styles.checkboxActive]}>
                    {saveAsTemplate && (
                        <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                        <Path d="M20 6L9 17l-5-5" />
                        </Svg>
                    )}
                    </View>
                    <Text style={styles.toggleText}>Save this trip as a frequent favorite</Text>
                </TouchableOpacity>

                {saveAsTemplate && (
                    <View style={{ marginTop: 16 }}>
                    <Text style={styles.fieldLabel}>FAVORITE NAME</Text>
                    <TextInput
                        style={[styles.minimalInput, errors.templateName ? { borderColor: '#EF4444' } : null]}
                        placeholder="e.g. Daily Kandy Route"
                        placeholderTextColor={theme.text.tertiary}
                        value={templateName}
                        onChangeText={setTemplateName}
                    />
                    <ErrorMessage message={errors.templateName} />
                    </View>
                )}
                </View>
            )}

            <TouchableOpacity 
              style={[
                styles.submitButton, 
                (loading || (isEditMode && !hasChanges)) && { opacity: 0.5 }
              ]} 
              onPress={handlePostPress}
              disabled={loading || (isEditMode && !hasChanges)}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Update Favorite' : (saveAsTemplate ? 'Post & Save Template' : 'Create Trip')}
                </Text>
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
    paddingBottom: 10,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 24,
    top: 10,
    zIndex: 10,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
    
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 24,
    marginTop: 10,
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
    fontSize: 14,
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
    paddingTop: 38,
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
    height: 75,
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
  templatesSection: {
    marginBottom: 24,
    
  },
  templatesScroll: {
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 1,
  },
  templateCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 160,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  templateIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.1)' : '#DCFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateActionBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  templateName: {
    fontSize: 13,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    marginBottom: 2,
  },
  templateRoute: {
    fontSize: 10,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
  },
  templateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.primary,
  },
  toggleText: {
    fontSize: 14,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
});
}



export default CreateTripScreen;
