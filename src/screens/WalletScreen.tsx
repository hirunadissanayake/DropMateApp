import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';

const WalletScreen = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF7ED', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.content}>
        <View style={styles.illustrationBox}>
          <Svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <Path d="M1 10h22" />
            <Path d="M12 14h6" />
          </Svg>
        </View>
        <Text style={styles.title}>Secure Wallet</Text>
        <Text style={styles.subtitle}>$0.00 Credits Available. Top up your balance for one-click payments.</Text>
      </SafeAreaView>
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
    width: 140,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#C2410C',
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
  },
});

export default WalletScreen;
