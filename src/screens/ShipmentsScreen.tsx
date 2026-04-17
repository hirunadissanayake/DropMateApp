import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const ShipmentsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F0FFF8', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.content}>
        <View style={styles.illustrationBox}>
          <Svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#006C52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 8L12 3L3 8V16L12 21L21 16V8Z" />
            <Path d="M3 8L12 13L21 8" />
            <Path d="M12 21V13" />
            <Path d="M7 5.5L16 10.5" strokeOpacity="0.3" />
          </Svg>
        </View>
        <Text style={styles.title}>No Shipments Yet</Text>
        <Text style={styles.subtitle}>Your delivery journey starts here. Once you send a parcel, you'll see it here.</Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateParcel')}
        >
          <Text style={styles.addButtonText}>Create Parcel</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateParcel')}
      >
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 5V19M5 12H19" />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  illustrationBox: {
    width: 160,
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Regular',
    marginBottom: 40,
  },
  addButton: {
    backgroundColor: '#006C52',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#006C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006C52',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default ShipmentsScreen;
