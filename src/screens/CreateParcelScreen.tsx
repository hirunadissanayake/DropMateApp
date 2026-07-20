import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { requestGalleryPermission } from '../utils/galleryPermission';
import { useAuthStore } from '../store/authStore';
import * as parcelService from '../services/parcelService';
import Toast from 'react-native-toast-message';
import CustomDropdown from '../components/common/CustomDropdown';
import BackButton from '../components/common/BackButton';
import CustomAlert from '../components/common/CustomAlert';
import { Typography } from '../constants/Typography';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const { width } = Dimensions.get('window');

const CreateParcelScreen = () => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  
  const [parcelName, setParcelName] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [weight, setWeight] = useState('');
  const [method, setMethod] = useState('DIRECT');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE');
  const [loading, setLoading] = useState(false);
  
  const [fromLocationList, setFromLocationList] = useState<string[]>([]);
  const [toLocationList, setToLocationList] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [priceData, setPriceData] = useState<any>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAlert, setShowAlert] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isWeightBased = !selectedCategory || selectedCategory.pricingType === 'WEIGHT_BASED';
  const categoryDescriptions = categories.reduce((acc, c) => {
    if (c.description) acc[c.name] = c.description;
    return acc;
  }, {} as Record<string, string>);

  useEffect(() => {
    if (token) {
      fetchFromLocations();
      fetchCategories();
    }
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    setErrors({}); // Clear errors on refresh
    if (token) {
      await Promise.all([fetchFromLocations(), fetchCategories()]);
    }
    setRefreshing(false);
  };

  const fetchCategories = async () => {
    try {
      const data = await parcelService.getCategories(token!);
      setCategories(data);
      setCategoryId((prev) => prev || (data.length > 0 ? data[0].id : ''));
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const ErrorMessage = ({ message }: { message: string }) => {
    if (!message) return null;
    return <Text style={styles.errorText}>{message}</Text>;
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
      const locations = await parcelService.getFromLocations(token!);
      setFromLocationList(locations);
    } catch (err) {
      console.error('Fetch from locations error:', err);
    }
  };

  const fetchToLocations = async () => {
    try {
      const locations = await parcelService.getToLocations(token!, fromLocation);
      setToLocationList(locations);
    } catch (err) {
      console.error('Fetch to locations error:', err);
    }
  };

  useEffect(() => {
    const weightReady = !isWeightBased || (weight && Number(weight) > 0);
    if (token && fromLocation && toLocation && categoryId && weightReady) {
      fetchPricePreview();
    } else {
      setPriceData(null);
    }
  }, [fromLocation, toLocation, weight, categoryId, isWeightBased, token]);

  const fetchPricePreview = async () => {
    setFetchingPrice(true);
    try {
      const data = await parcelService.getPreviewPrice(
        token!,
        fromLocation,
        toLocation,
        categoryId,
        isWeightBased ? Number(weight) : undefined
      );
      setPriceData(data);
    } catch (err) {
      console.error('Fetch price preview error:', err);
      setPriceData(null);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handlePickImage = () => {
    Alert.alert(
      'Upload Photos',
      'Choose a source',
      [
        { text: 'Camera', onPress: pickImageFromCamera },
        { text: 'Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const pickImageFromGallery = async () => {
    try {
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) return;
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 4 - images.length,
      });

      if (result.assets) {
        const newImages = [...images, ...result.assets].slice(0, 4);
        setImages(newImages);
      }
    } catch (err) {
      console.error('Gallery error:', err);
    }
  };

  const pickImageFromCamera = async () => {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Access Required',
              message: 'DropMate requires camera access to take photos of your parcel.',
              buttonNeutral: 'Later',
              buttonNegative: 'Deny',
              buttonPositive: 'Allow Access',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
              Toast.show({
                type: 'error',
                text1: 'Permission Required',
                text2: 'Please enable camera access in Settings.',
                onPress: () => Linking.openSettings()
              });
            }
            return;
          }
        }
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        if (images.length < 4) {
          setImages([...images, result.assets[0]]);
        } else {
          Toast.show({ type: 'info', text1: 'Limit reached', text2: 'Maximum 4 images allowed' });
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!token) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please login first' });
      return;
    }

    const newErrors: Record<string, string> = {};

    if (!parcelName.trim()) {
      newErrors.parcelName = 'Please enter a parcel name';
    } else if (/^\d+$/.test(parcelName.trim())) {
      newErrors.parcelName = 'Parcel name cannot be only numbers';
    }

    if (images.length === 0) {
      newErrors.images = 'Please upload at least one parcel photo';
    }

    if (!fromLocation) {
      newErrors.fromLocation = 'Please select a pickup location';
    }

    if (!toLocation) {
      newErrors.toLocation = 'Please select a drop-off location';
    }

    if (!categoryId) {
      newErrors.category = 'Please select a parcel category';
    }

    if (isWeightBased && (!weight || isNaN(Number(weight)) || Number(weight) <= 0)) {
      newErrors.weight = 'Please enter a valid weight (kg)';
    }

    if (!recipientName.trim()) {
      newErrors.recipientName = 'Please enter recipient name';
    } else if (/^\d+$/.test(recipientName.trim())) {
      newErrors.recipientName = 'Recipient name cannot be only numbers';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Please enter phone number';
    } else {
      const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
      if (cleanPhone.length < 9) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setShowAlert(true);
  };

  const handleFinalSubmit = async () => {
    setShowAlert(false);
    setLoading(true);
    try {
      const data = {
        name: parcelName,
        images: images,
        fromLocation,
        toLocation,
        categoryId,
        weight: isWeightBased ? Number(weight) : undefined,
        description,
        receiverName: recipientName,
        receiverPhone: phoneNumber,
        deliveryMethod: method,
        note: additionalNote,
        paymentMethod: paymentMethod,
      };

      const response = await parcelService.createParcel(token!, data);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Parcel created successfully!' });
      navigation.goBack();
    } catch (error: any) {
      console.error('Create parcel error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to create parcel',
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
          <View style={styles.headerActionRow}>
            <View style={styles.headerLeft}>
              <BackButton onPress={() => navigation.goBack()} />
            </View>
            <Text style={styles.headerTitleCenter}>New Parcel</Text>
            <View style={styles.headerRight} />
          </View>
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
            {/* Header Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroSubtitle}>Fill in the details to get started with your delivery.</Text>
            </View>

            {/* Parcel Details Section */}
            <View style={styles.contentCard}>
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>PARCEL NAME</Text>
                <TextInput
                  style={styles.minimalInput}
                  placeholder="Enter parcel name"
                  placeholderTextColor={theme.text.tertiary}
                  value={parcelName}
                  onChangeText={setParcelName}
                />
                <ErrorMessage message={errors.parcelName} />
              </View>

              <View style={styles.fieldSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>PHOTOS</Text>
                  <Text style={styles.photoCountText}>{images.length}/4</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoContainer}>
                  {images.length < 4 && (
                    <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage} activeOpacity={0.6}>
                      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 5V19M5 12H19" />
                      </Svg>
                    </TouchableOpacity>
                  )}
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.imageBox}>
                      <Image source={{ uri: img.uri }} style={styles.smallThumbnail} />
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => removeImage(idx)}>
                        <Text style={styles.deleteBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                <ErrorMessage message={errors.images} />
              </View>
            </View>

            {/* Parcel Category Section */}
            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>PARCEL CATEGORY</Text>
              <CustomDropdown
                label=""
                options={categories.map((c) => c.name)}
                selectedOption={selectedCategory?.name || ''}
                onSelect={(val) => {
                  const cat = categories.find((c) => c.name === val);
                  if (cat) setCategoryId(cat.id);
                }}
                optionSubtitles={categoryDescriptions}
                placeholder="Select parcel category"
                theme={theme}
              />
              <ErrorMessage message={errors.category} />
            </View>

            {/* Route & Delivery Section */}
            <View style={styles.contentCard}>
              <View style={styles.routeHeader}>
                <Text style={styles.fieldLabel}>DELIVERY ROUTE</Text>
              </View>
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
                      onSelect={(val) => setFromLocation(val)}
                      placeholder="Pickup location"
                      theme={theme}
                    />
                    <ErrorMessage message={errors.fromLocation} />
                    <View style={{ height: 12 }} />
                    <CustomDropdown
                      label=""
                      options={toLocationList}
                      selectedOption={toLocation}
                      onSelect={(val) => setToLocation(val)}
                      placeholder={fromLocation ? "Select drop-off" : "First select pickup"}
                      disabled={!fromLocation}
                      theme={theme}
                    />
                    <ErrorMessage message={errors.toLocation} />
                  </View>
                </View>

              <View style={styles.divider} />

              <View style={styles.dualFields}>
                {isWeightBased && (
                  <>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
                      <TextInput
                        style={styles.minimalInput}
                        keyboardType="numeric"
                        value={weight}
                        onChangeText={setWeight}
                        placeholder="0.0"
                        placeholderTextColor={theme.text.tertiary}
                      />
                      <ErrorMessage message={errors.weight} />
                    </View>
                    <View style={{ width: 24 }} />
                  </>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>METHOD</Text>
                  <TouchableOpacity style={styles.minimalInput} activeOpacity={0.7}>
                    <Text style={styles.methodText}>{method}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>PAYMENT METHOD</Text>
                <View style={styles.paymentMethodContainer}>
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('ONLINE')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.paymentOptionText, paymentMethod === 'ONLINE' && styles.paymentOptionTextActive]}>Card Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'CASH_ON_PICKUP' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('CASH_ON_PICKUP')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.paymentOptionText, paymentMethod === 'CASH_ON_PICKUP' && styles.paymentOptionTextActive]}>Cash on Pickup</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'CASH_ON_DELIVERY' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.paymentOptionText, paymentMethod === 'CASH_ON_DELIVERY' && styles.paymentOptionTextActive]}>Cash on Delivery</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.paymentInfoText}>
                  {paymentMethod === 'ONLINE' 
                    ? "Pay securely using your credit or debit card."
                    : paymentMethod === 'CASH_ON_PICKUP'
                    ? "Sender pays the traveler in cash when handing over the parcel."
                    : "Receiver pays the traveler in cash upon successful delivery."}
                </Text>
              </View>
            </View>

            {/* Recipient Details */}
            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>RECEIVER INFO</Text>
              <View style={styles.fieldSection}>
                <TextInput
                  style={styles.minimalInput}
                  placeholder="Receiver Name"
                  placeholderTextColor={theme.text.tertiary}
                  value={recipientName}
                  onChangeText={setRecipientName}
                />
                <ErrorMessage message={errors.recipientName} />
              </View>
              <View style={styles.fieldSection}>
                <TextInput
                  style={styles.minimalInput}
                  placeholder="Phone Number"
                  placeholderTextColor={theme.text.tertiary}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={10}
                />
                <ErrorMessage message={errors.phoneNumber} />
              </View>
            </View>

            {/* Description Section - temporarily disabled, category description shown in the category dropdown instead
            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <View style={styles.fieldSection}>
                <TextInput
                  style={styles.minimalTextArea}
                  placeholder="What is inside the parcel?"
                  placeholderTextColor={theme.text.tertiary}
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>
            */}

            {/* Additional Note Section */}
            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>ADDITIONAL NOTE (OPTIONAL)</Text>
              <View style={styles.fieldSection}>
                <TextInput
                  style={[styles.minimalTextArea, { minHeight: 80 }]}
                  placeholder="Any special handling instructions?"
                  placeholderTextColor={theme.text.tertiary}
                  multiline
                  value={additionalNote}
                  onChangeText={setAdditionalNote}
                />
              </View>
            </View>

            {/* Price Preview Card */}
            {(priceData || fetchingPrice) && (
              <View style={styles.priceCard}>
                <View style={styles.priceHeader}>
                  <View>
                    <Text style={styles.priceLabelCap}>ORDER SUMMARY</Text>
                    <Text style={styles.priceSummaryTitle}>Estimated Cost</Text>
                  </View>
                  {fetchingPrice && <ActivityIndicator size="small" color={theme.primary} />}
                </View>
                {priceData && (
                  <View style={styles.priceContent}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceItemLabel}>Base Delivery Rate</Text>
                      <Text style={styles.priceItemValue}>LKR {priceData.travelerPayout.toLocaleString()}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceItemLabel}>Service Fee</Text>
                      <Text style={styles.priceItemValue}>LKR {priceData.platformFee.toLocaleString()}</Text>
                    </View>
                    <View style={styles.totalDivider} />
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total Payable</Text>
                      <Text style={styles.totalValue}>LKR {priceData.price.toLocaleString()}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, (loading || (token && (!priceData && !fetchingPrice) && (fromLocation && toLocation && weight))) && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Parcel</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
        {/* Global Confirmation Alert */}
        <CustomAlert
          visible={showAlert}
          theme={theme}
          title="Create Parcel"
          message="Are you sure you want to create this parcel? Please verify the details before proceeding."
          confirmText="Yes, Create"
          cancelText="Review"
          onConfirm={handleFinalSubmit}
          onCancel={() => setShowAlert(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingBottom: 0,
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
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerLeft: {
    width: 44,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 44,
  },
  headerTitleCenter: {
    fontSize: 28,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
    letterSpacing: -0.5,
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 24,
    marginTop: 20,
  },
  heroTitle: {
    fontSize: 28,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
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
  fieldSection: {
    marginBottom: 20,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoCountText: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontFamily: Typography.bold,
  },
  photoContainer: {
    gap: 12,
  },
  uploadButton: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: theme.isDark ? 'rgba(16,185,129,0.05)' : '#F0FDF4',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.isDark ? 'rgba(16,185,129,0.2)' : '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  smallThumbnail: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: Typography.bold,
    lineHeight: 18,
  },
  routeHeader: {
    marginBottom: 16,
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
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 20,
  },
  dualFields: {
    flexDirection: 'row',
  },
  methodText: {
    fontSize: 15,
    color: theme.text.primary,
    fontFamily: Typography.bold,
    lineHeight: 52,
  },
  paymentMethodContainer: {
    gap: 12,
    marginTop: 8,
  },
  paymentOption: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
  },
  paymentOptionActive: {
    borderColor: theme.primary,
    backgroundColor: theme.isDark ? 'rgba(16,185,129,0.05)' : '#F0FDF4',
    borderWidth: 2,
  },
  paymentOptionText: {
    fontSize: 14,
    color: theme.text.secondary,
    fontFamily: Typography.bold,
  },
  paymentOptionTextActive: {
    color: theme.primary,
  },
  paymentInfoText: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
    marginTop: 12,
    lineHeight: 18,
  },
  priceCard: {
    backgroundColor: theme.isDark ? 'rgba(16,185,129,0.05)' : '#F8FAFC',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  priceLabelCap: {
    fontSize: 10,
    color: theme.text.tertiary,
    fontFamily: Typography.extraBold,
    letterSpacing: 1,
    marginBottom: 6,
  },
  priceSummaryTitle: {
    fontSize: 18,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
  },
  priceContent: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItemLabel: {
    fontSize: 14,
    color: theme.text.secondary,
    fontFamily: Typography.medium,
  },
  priceItemValue: {
    fontSize: 14,
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
  totalDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    color: theme.text.primary,
    fontFamily: Typography.extraBold,
  },
  totalValue: {
    fontSize: 20,
    color: theme.primary,
    fontFamily: Typography.extraBold,
  },
  submitButton: {
    height: 58,
    backgroundColor: theme.primary,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Typography.extraBold,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: Typography.bold,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default CreateParcelScreen;
