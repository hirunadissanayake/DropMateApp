import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { AppTheme, lightTheme } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import Svg, { Path } from 'react-native-svg';

interface CustomInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPressRightIcon?: () => void;
  secureTextEntry?: boolean;
  isPassword?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  containerStyle?: ViewStyle;
  maxLength?: number;
  // optional theme — falls back to lightTheme if not provided
  theme?: AppTheme;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  rightIcon,
  onPressRightIcon,
  secureTextEntry,
  isPassword,
  autoCapitalize = 'none',
  keyboardType = 'default',
  containerStyle,
  maxLength,
  theme = lightTheme,
}) => {
  const [internalSecure, setInternalSecure] = React.useState(true);
  const isActuallySecure = isPassword ? internalSecure : secureTextEntry;

  const eyeColor = theme.text.tertiary;

  const renderEyeIcon = () => {
    if (!isPassword) return rightIcon;

    return (
      <TouchableOpacity
        onPress={() => setInternalSecure(!internalSecure)}
        style={styles.rightIconContainer}
      >
        <Svg width="22" height="24" viewBox="0 0 24 24" fill="none">
          {!internalSecure ? (
            <Path
              d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
              fill={eyeColor}
              fillOpacity="0.8"
            />
          ) : (
            <Path
              d="M12 7C14.76 7 17 9.24 17 12C17 13.41 16.42 14.67 15.48 15.59L17.5 17.61C19.33 16.22 20.73 14.28 21.58 12C19.91 7.61 15.64 4.5 10.58 4.5C9.05 4.5 7.6 4.8 6.28 5.37L8.08 7.17C8.86 7.06 9.66 7 10.5 7H12ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.88 19.5 15.63 19.06 17.2 18.27L17.72 18.79L20.45 21.52L21.73 20.24L3.27 1.79L2 3.06L2 4.27ZM9.53 11.8L11.78 14.05C11.39 14.16 10.96 14.22 10.5 14.22C9.27 14.22 8.28 13.23 8.28 12C8.28 11.54 8.34 11.11 8.45 10.72L9.53 11.8ZM14.22 12C14.22 10.77 13.23 9.78 12 9.78C11.54 9.78 11.11 9.84 10.72 9.95L9.34 8.57C10.15 8.1 11.04 7.82 12 7.82C14.31 7.82 16.18 9.69 16.18 12C16.18 12.96 15.9 13.85 15.43 14.66L14.05 13.28C14.16 12.89 14.22 12.46 14.22 12Z"
              fill={eyeColor}
              fillOpacity="0.8"
            />
          )}
        </Svg>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[
          styles.label,
          { color: theme.text.secondary },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, { color: theme.text.primary }]}
          placeholder={placeholder}
          placeholderTextColor={theme.text.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isActuallySecure}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
        {isPassword
          ? renderEyeIcon()
          : rightIcon && (
              <TouchableOpacity
                onPress={onPressRightIcon}
                style={styles.rightIconContainer}
              >
                {rightIcon}
              </TouchableOpacity>
            )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: Typography.bold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontFamily: Typography.medium,
  },
  rightIconContainer: {
    padding: 8,
  },
});

export default CustomInput;
