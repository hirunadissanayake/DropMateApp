import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import BackButton from './BackButton';
import { Colors, AppTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';

interface ScreenHeaderProps {
  onBack: () => void;
  currentStep?: number;
  totalSteps?: number;
  title?: string;
  theme?: AppTheme;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  onBack,
  currentStep,
  totalSteps = 3,
  title,
}) => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} color={theme.text.primary} />
      
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

      <View style={styles.spacer} />
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 0,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0, 108, 82, 0.1)',
  },
  activeStep: {
    width: 24,
    backgroundColor: theme.primary,
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
    color: theme.text.primary,
    fontFamily: Typography.bold,
  },
});

export default ScreenHeader;
