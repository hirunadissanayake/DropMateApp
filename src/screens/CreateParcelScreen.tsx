import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAuthStore } from '../store/authStore';
import * as parcelService from '../services/parcelService';
import Toast from 'react-native-toast-message';
import CustomDropdown from '../components/common/CustomDropdown';
import BackButton from '../components/common/BackButton';
import CustomAlert from '../components/common/CustomAlert';

const { width } = Dimensions.get('window');

const CreateParcelScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
  const [loading, setLoading] = useState(false);
  
  const [fromLocationList, setFromLocationList] = useState<string[]>([]);
  const [toLocationList, setToLocationList] = useState<string[]>([]);
  const [priceData, setPriceData] = useState<any>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (token) {
      fetchFromLocations();
    }
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    setErrors({}); // Clear errors on refresh
    if (token) {
      await fetchFromLocations();
    }
    setRefreshing(false);
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
    if (token && fromLocation && toLocation && weight && Number(weight) > 0) {
      fetchPricePreview();
    } else {
      setPriceData(null);
    }
  }, [fromLocation, toLocation, weight, token]);

  const fetchPricePreview = async () => {
    setFetchingPrice(true);
    try {
      const data = await parcelService.getPreviewPrice(token!, fromLocation, toLocation, Number(weight));
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
      ]
    );
  };

  const pickImageFromGallery = async () => {
    try {
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

    // Comprehensive Validations
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

    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
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
      // Scroll to top or just stop
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
        weight: Number(weight),
        description,
        receiverName: recipientName,
        receiverPhone: phoneNumber,
        deliveryMethod: method,
        note: additionalNote,
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
    <SafeAreaView style={styles.container}>
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
              colors={['#006C52']} 
              tintColor={'#006C52'}
            />
          }
        >
          <LinearGradient
            colors={['#DCFBEB', '#F0FDF4', '#F8FAFC']}
            style={styles.backgroundGradient}
          />

          <View style={styles.contentPadding}>
            {/* Header Section */}
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>New Parcel</Text>
              <Text style={styles.heroSubtitle}>Fill in the details to get started with your delivery.</Text>
            </View>

            {/* Parcel Details Section */}
            <View style={styles.contentCard}>
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>PARCEL NAME</Text>
                <TextInput
                  style={styles.minimalInput}
                  placeholder="Enter parcel name"
                  placeholderTextColor="#94A3B8"
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
                      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            {/* Route & Delivery Section */}
            <View style={styles.contentCard}>
              <View style={styles.routeHeader}>
                <Text style={styles.fieldLabel}>DELIVERY ROUTE</Text>
              </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={styles.routeTimeline}>
                    <View style={styles.dotFilled} />
                    <View style={styles.dashedLine} />
                    <View style={styles.dotOutline} />
                  </View>
                  <View style={styles.routeInputs}>
                    <CustomDropdown
                      label=""
                      options={fromLocationList}
                      selectedOption={fromLocation}
                      onSelect={(val) => setFromLocation(val)}
                      placeholder="Pickup location"
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
                    />
                    <ErrorMessage message={errors.toLocation} />
                  </View>
                </View>

              <View style={styles.divider} />

              <View style={styles.dualFields}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
                  <TextInput
                    style={styles.minimalInput}
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="0.0"
                  />
                  <ErrorMessage message={errors.weight} />
                </View>
                <View style={{ width: 24 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>METHOD</Text>
                  <TouchableOpacity style={styles.minimalInput} activeOpacity={0.7}>
                    <Text style={styles.methodText}>{method}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Recipient Details */}
            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>RECIPIENT INFO</Text>
              <View style={styles.fieldSection}>
                <TextInput
                  style={styles.minimalInput}
                  placeholder="Recipient Name"
                  placeholderTextColor="#94A3B8"
                  value={recipientName}
                  onChangeText={setRecipientName}
                />
                <ErrorMessage message={errors.recipientName} />
              </View>
              <View style={styles.fieldSection}>
                <TextInput
                  style={styles.minimalInput}
                  placeholder="Phone Number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={10}
                />
                <ErrorMessage message={errors.phoneNumber} />
              </View>
            </View>

            {/* Description Section */}
            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <View style={styles.fieldSection}>
                <TextInput
                  style={styles.minimalTextArea}
                  placeholder="What is inside the parcel?"
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Additional Note Section */}
            <View style={styles.contentCard}>
              <Text style={styles.fieldLabel}>ADDITIONAL NOTE (OPTIONAL)</Text>
              <View style={styles.fieldSection}>
                <TextInput
                  style={[styles.minimalTextArea, { minHeight: 80 }]}
                  placeholder="Any special handling instructions?"
                  placeholderTextColor="#94A3B8"
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
                  {fetchingPrice && <ActivityIndicator size="small" color="#006C52" />}
                </View>
                {priceData && (
                  <View style={styles.priceContent}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceItemLabel}>Delivery Rate</Text>
                      <Text style={styles.priceItemValue}>LKR {priceData.price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceItemLabel}>Platform Service Fee</Text>
                      <Text style={styles.priceItemValue}>LKR {priceData.platformFee.toLocaleString()}</Text>
                    </View>
                    <View style={styles.totalDivider} />
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total Payable</Text>
                      <Text style={styles.totalValue}>LKR {(priceData.price + priceData.platformFee).toLocaleString()}</Text>
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
    paddingTop: Platform.OS === 'ios' ? 20 : 45,
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
  },
  miniLabel: {
    fontSize: 10,
    color: '#006C52',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-ExtraBold',
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontFamily: 'Manrope',
    lineHeight: 22,
    textAlign: 'center',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0FDF4',
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  minimalInput: {
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    fontFamily: 'Manrope',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  minimalTextArea: {
    minHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#0F172A',
    fontFamily: 'Manrope',
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: '#64748B',
    fontFamily: 'Manrope',
  },
  photoContainer: {
    gap: 12,
  },
  uploadButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  smallThumbnail: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  routeHeader: {
    marginBottom: 16,
  },
  routeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  routeTimeline: {
    alignItems: 'center',
    paddingTop: 15,
  },
  dotFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#006C52',
    marginTop: 12,
  },
  dashedLine: {
    width: 1,
    height: 55,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  dotOutline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#006C52',
    backgroundColor: '#FFF',
  },
  routeInputs: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  dualFields: {
    flexDirection: 'row',
  },
  methodText: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'Manrope',
    lineHeight: 45,
  },
  priceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    marginBottom: 20,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priceLabelCap: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'Manrope',
    letterSpacing: 2,
    marginBottom: 4,
  },
  priceSummaryTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Manrope-Bold',
    fontWeight: '700',
  },
  priceContent: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItemLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  priceItemValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  totalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '800',
  },
  submitButton: {
    height: 60,
    backgroundColor: '#006C52',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  submitButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Manrope',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
});

export default CreateParcelScreen;
