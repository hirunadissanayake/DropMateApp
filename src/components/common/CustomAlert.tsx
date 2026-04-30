import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../../constants/Typography';
import { useTheme } from '../../context/ThemeContext';
import { AppTheme } from '../../constants/Colors';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: 'success' | 'warning' | 'error' | 'info';
  showCancel?: boolean;
  theme?: AppTheme;
}

const { width } = Dimensions.get('window');

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  type = 'info',
  showCancel = true,
  theme: propTheme,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = propTheme || contextTheme;
  const s = makeStyles(theme);

  const getIconColor = () => {
    switch (type) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return theme.primary;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success': return theme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';
      case 'warning': return theme.isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB';
      case 'error': return theme.isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2';
      default: return theme.isDark ? 'rgba(61, 217, 164, 0.15)' : '#F0FDF4';
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View style={s.overlay}>
        <View style={s.alertContainer}>
          <View style={s.iconContainer}>
            <View style={[s.iconCircle, { backgroundColor: getIconBg() }]}>
              {type === 'warning' || type === 'error' ? (
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={getIconColor()} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 8v4" />
                  <Path d="M12 16h.01" />
                </Svg>
              ) : (
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={getIconColor()} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 16v-4" />
                  <Path d="M12 8h.01" />
                </Svg>
              )
              }
            </View>
          </View>

          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>

          <View style={s.buttonContainer}>
            {showCancel && !loading && (
              <TouchableOpacity 
                style={[s.button, s.cancelButton]} 
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={s.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[
                s.button, 
                s.confirmButton, 
                type === 'warning' || type === 'error' ? { backgroundColor: '#EF4444' } : {},
                loading ? { opacity: 0.8 } : {}
              ]} 
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(5, 32, 23, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    width: '100%',
    maxWidth: width - 48,
    backgroundColor: theme.background,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: theme.isDark ? 0.4 : 0.25,
    shadowRadius: 25,
    elevation: 12,
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: theme.border,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: theme.text.primary,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Typography.bold,
  },
  message: {
    fontSize: 16,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: Typography.medium,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
  },
  confirmButton: {
    backgroundColor: theme.primary,
  },
  cancelButtonText: {
    color: theme.text.tertiary,
    fontSize: 15,
    fontFamily: Typography.medium,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Typography.medium,
  },
});

export default CustomAlert;
