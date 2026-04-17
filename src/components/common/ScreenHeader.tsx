import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import BackButton from './BackButton';
import { Colors } from '../../constants/Colors';

interface ScreenHeaderProps {
  onBack: () => void;
  currentStep?: number;
  totalSteps?: number;
  title?: string;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  onBack,
  currentStep,
  totalSteps = 3,
  title,
}) => {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} />
      
      {currentStep !== undefined && (
        <View style={styles.stepIndicator}>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            return (
              <View 
                key={index} 
                style={[
                  styles.stepDot, 
                  isActive && styles.activeStep
                ]} 
              />
            );
          })}
        </View>
      )}

      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
      )}

      
      {/* Spacer to keep step indicator centered */}
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 36 : 0,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 108, 82, 0.1)',
  },
  activeStep: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  spacer: {
    width: 44, 
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Manrope' : 'Manrope-Bold',
  },
});

export default ScreenHeader;
