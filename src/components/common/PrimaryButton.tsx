import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, AppTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';

interface PrimaryButtonProps {
  text: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  theme?: AppTheme;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  text,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.disabledButton, style]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View style={styles.contentContainer}>
          <Text style={[styles.text, textStyle]}>{text}</Text>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  button: {
    height: 56,
    backgroundColor: theme.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: theme.isDark ? '#000' : '#00513D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'transparent',
    fontFamily: Typography.bold,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrapper: {
    marginLeft: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default PrimaryButton;
